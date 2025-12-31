/**
 * Discord Helper
 *
 * @author Wellington Estevo
 * @version 2.1.0
 */

import "@shared/prototypes.ts";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { log } from "@shared/helpers.ts";
import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { dirname, fromFileUrl, join } from "@std/path";

import type { GuildMember } from "discord.js";
import type { GithubData, StreamData } from "@shared/types.ts";

type RenderTemplateToPngOptions = {
  templatePath: string;
  outPath: string;
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  scale?: number;
  animationTime?: number;
  fontPaths?: string[];
};

type RenderTemplateToPng = (
  options: RenderTemplateToPngOptions
) => Promise<void>;

type HtmlToImageModule = {
  renderTemplateToPng?: RenderTemplateToPng;
  default?: RenderTemplateToPng | { renderTemplateToPng?: RenderTemplateToPng };
};

type GithubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
};

type GithubRepository = {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  owner: {
    avatar_url: string;
  };
};

type GithubLabel = {
  name: string;
};

type GithubAssignee = {
  login: string;
};

type GithubIssue = {
  title: string;
  body: string | null;
  html_url: string;
  user: GithubUser;
  labels?: GithubLabel[];
  assignees?: GithubAssignee[];
};

type GithubRelease = {
  tag_name: string;
  body: string | null;
  html_url: string;
};

type GithubFork = {
  full_name: string;
  html_url: string;
};

type GithubCommit = {
  message: string;
  url: string;
};

type GithubEventData = GithubIssue | GithubRelease | GithubFork | GithubCommit;

type GithubWebhookPayload = {
  repository: GithubRepository;
  sender: GithubUser;
  action?: string;
  fork?: GithubFork;
  issue?: GithubIssue;
  release?: GithubRelease;
  head_commit?: GithubCommit;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGithubWebhookPayload = (
  value: unknown
): value is GithubWebhookPayload => {
  if (!isRecord(value)) return false;
  const repository = value.repository;
  const sender = value.sender;

  if (!isRecord(repository) || !isRecord(sender)) return false;
  if (!isRecord(repository.owner)) return false;

  return (
    typeof repository.name === "string" &&
    typeof repository.full_name === "string" &&
    typeof repository.html_url === "string" &&
    typeof repository.private === "boolean" &&
    typeof repository.owner.avatar_url === "string" &&
    typeof sender.login === "string" &&
    typeof sender.avatar_url === "string" &&
    typeof sender.html_url === "string"
  );
};

const resolveRenderTemplateToPng = (
  mod: HtmlToImageModule
): RenderTemplateToPng | undefined => {
  if (typeof mod.renderTemplateToPng === "function") {
    return mod.renderTemplateToPng;
  }

  if (typeof mod.default === "function") {
    return mod.default;
  }

  if (mod.default && typeof mod.default === "object") {
    const candidate = mod.default as {
      renderTemplateToPng?: RenderTemplateToPng;
    };
    if (typeof candidate.renderTemplateToPng === "function") {
      return candidate.renderTemplateToPng;
    }
  }

  return undefined;
};

export class DiscordUtils {
  private static readonly WELCOME_TEMPLATE_WIDTH = 1920;
  private static readonly WELCOME_TEMPLATE_HEIGHT = 1080;
  private static readonly WELCOME_IMAGE_WIDTH = 600;
  private static readonly WELCOME_IMAGE_HEIGHT = 255;

  private static readonly WELCOME_TEMPLATE_PATH = join(
    dirname(fromFileUrl(import.meta.url)),
    "DiscordWelcome.html"
  );
  private static htmlToImagePromise?: Promise<RenderTemplateToPng | undefined>;

  private static getHtmlToImageRenderer(): Promise<
    RenderTemplateToPng | undefined
  > {
    if (!DiscordUtils.htmlToImagePromise) {
      DiscordUtils.htmlToImagePromise = Promise.resolve().then(() => {
        try {
          const require = createRequire(import.meta.url);
          const mod = require("@grouvie/html-to-image") as HtmlToImageModule;
          const render = resolveRenderTemplateToPng(mod);
          if (!render) {
            log(
              new Error(
                "html-to-image module loaded without renderTemplateToPng"
              )
            );
            return;
          }

          return render;
        } catch (error: unknown) {
          // Missing dependency / native module load failure / etc.
          log(error);
          return;
        }
      });
    }

    return DiscordUtils.htmlToImagePromise;
  }

  private static renderMiniJinjaFallback(
    template: string,
    data: Record<string, unknown>
  ): string {
    // Minimal replacement-only fallback so we can still use the same template file
    // if html_to_image_node fails at runtime.
    return template.replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_match, key: string) => {
        const value = data[key];
        return value === undefined || value === null ? "" : String(value);
      }
    );
  }

  private async fetchAsDataUri(url: string): Promise<string | undefined> {
    try {
      const response = await fetch(url);
      if (!response.ok) return;

      const contentType =
        response.headers.get("content-type") ?? "application/octet-stream";
      const bytes = await response.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      return `data:${contentType};base64,${base64}`;
    } catch (error: unknown) {
      log(error);
      return;
    }
  }

  /** Generates welcome attachment
   *
   * @returns {Promise<AttachmentBuilder|null>}
   */
  public async generateWelcomeImageAttachment(
    member: GuildMember,
    message: string
  ): Promise<AttachmentBuilder | undefined> {
    if (!member || !message) return;

    const colors = ["red", "green", "yellow", "beige", "blue", "purple"];
    const [text1 = "", text2 = ""] = message.split("|");
    const avatarUrl = member.displayAvatarURL({ extension: "jpg", size: 512 });
    const avatarDataUri = await this.fetchAsDataUri(avatarUrl);

    const data = {
      user: member.displayName,
      color: colors[Math.floor(Math.random() * colors.length)],
      text_1: text1,
      text_2: text2,
      avatar: avatarDataUri ?? avatarUrl,
      number: `#${member.guild.memberCount}`,
    } satisfies Record<string, unknown>;

    // 1) Preferred path: local HTML -> PNG using html_to_image_node (MiniJinja template + data)
    try {
      const renderTemplateToPng = await DiscordUtils.getHtmlToImageRenderer();
      if (renderTemplateToPng) {
        const outPath = await Deno.makeTempFile({ suffix: ".png" });
        try {
          await renderTemplateToPng({
            templatePath: DiscordUtils.WELCOME_TEMPLATE_PATH,
            outPath,
            data,
            width: DiscordUtils.WELCOME_IMAGE_WIDTH,
            height: DiscordUtils.WELCOME_IMAGE_HEIGHT,
          });

          const pngBytes = await Deno.readFile(outPath);
          const pngBuffer = Buffer.from(pngBytes);
          return new AttachmentBuilder(pngBuffer, {
            name: `welcome-${member.displayName}.png`,
          });
        } finally {
          try {
            await Deno.remove(outPath);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error: unknown) {
      log(error);
      // Continue to fallback below
    }

    // 2) Fallback: Cloudflare browser rendering screenshot (same template file, simple {{var}} replacement)
    try {
      const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") ?? "";
      const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") ?? "";
      if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        log(
          new Error(
            "Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN for welcome-image fallback."
          )
        );
        return;
      }

      const template = await Deno.readTextFile(
        DiscordUtils.WELCOME_TEMPLATE_PATH
      );
      const htmlContent = DiscordUtils.renderMiniJinjaFallback(template, data);

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/screenshot`,
        {
          body: JSON.stringify({ html: htmlContent }),
          method: "POST",
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        log(
          new Error(
            `Worker returned ${response.status}: ${response.statusText}`
          )
        );
        return;
      }

      const screenshotBuffer = Buffer.from(await response.arrayBuffer());
      return new AttachmentBuilder(screenshotBuffer, {
        name: `welcome-${member.displayName}.png`,
      });
    } catch (error: unknown) {
      log(error);
      return;
    }
  }

  /** Generate Github event embed
   *
   * @param {string} eventName
   * @param {unknown} githubData
   * @returns {EmbedBuilder|undefined}
   */
  public generateGithubEmbed(
    eventName: string,
    githubData: unknown
  ): EmbedBuilder | undefined {
    if (!eventName || !isGithubWebhookPayload(githubData)) return;

    const action = githubData.action ?? "";
    let eventData: GithubEventData | undefined;
    let eventTitle = "";
    let eventDescription = "";
    const allowedActions: string[] = [];

    const data: GithubData = {
      title: "",
      description: "",
      url: githubData.sender.html_url,
      displayName: githubData.sender.login,
      profilePictureUrl: githubData.sender.avatar_url,
      userUrl: githubData.sender.html_url,
      repoName: githubData.repository.name,
      repoFullname: githubData.repository.full_name,
      repoImage: githubData.repository.owner.avatar_url,
      repoUrl: githubData.repository.html_url,
      repoPrivate: githubData.repository.private,
    };

    // Do only something on these events
    // https://docs.github.com/en/webhooks/webhook-events-and-payloads
    switch (eventName) {
      case "fork": {
        const fork = githubData.fork;
        if (!fork || !fork.full_name || !fork.html_url) return;
        eventData = fork;
        data.title = `[${data.repoFullname}] New fork`;
        data.description = `${data.displayName} just forked your repo to '${fork.full_name}'`;
        data.url = fork.html_url;
        break;
      }

      case "issues": {
        allowedActions.push("opened");
        eventTitle = "New issue";
        /*if ( githubData['action'] === 'closed' )
					eventTitle = 'Issue closed';
				else if ( githubData['action'] === 'reopened' )
					eventTitle = 'Issue reopened';*/

        const issue = githubData.issue;
        if (!issue || !issue.title || !issue.html_url) return;
        eventData = issue;
        data.title = `[${data.repoFullname}] ${eventTitle} › ${issue.title}`;
        data.description = issue.body ?? "";
        data.url = issue.html_url;
        data.displayName = issue.user.login;
        data.profilePictureUrl = issue.user.avatar_url;
        data.userUrl = issue.user.html_url;

        if (!allowedActions.includes(action)) return;

        break;
      }

      /*case 'issue_comment':
				allowedActions.push( 'created' );
				eventData = githubData[ 'comment' ];
				data.title = `[${ data.repoFullname }] New comment to '${ githubData[ 'issue' ].title }'`;
				data.description = eventData.body;
				data.url = eventData.html_url;
				//data.displayName = eventData.user.login;
				//data.profilePictureUrl = eventData.user.avatar_url;
				//data.userUrl = eventData.user.html_url;

				if ( !allowedActions.includes( githubData['action'] ) )
					return;

				break;*/

      case "release": {
        allowedActions.push("published");
        const release = githubData.release;
        if (!release || !release.tag_name || !release.html_url) return;
        eventData = release;
        data.title = `[${data.repoFullname}] New release › ${release.tag_name}`;
        data.description = release.body ?? "";
        data.url = release.html_url;

        if (!allowedActions.includes(action)) return;

        break;
      }

      case "push": {
        const commit = githubData.head_commit;
        if (!commit || !commit.message) return;
        eventData = commit;
        data.title = `[${data.repoFullname}] New Push`;
        data.description = commit.message;

        if (!data.repoPrivate && commit.url) data.url = commit.url;

        break;
      }

      case "star":
        eventTitle = action === "created" ? "New Star added" : "Star removed";
        data.title = `[${data.repoFullname}] ${eventTitle}`;

        eventDescription =
          action === "created" ? "just starred" : "just unstarred";
        data.description = `${data.displayName} ${eventDescription} '${data.repoName}'`;

        data.url = data.repoUrl;
        break;

      /*case 'watch':
				data.title = `[${ data.repoFullname }] New Watcher`;
				data.description = `${ data.displayName } just started watching the repo '${ data.repoName }'`;
				data.url = data.repoUrl;
				break;*/

      default:
        return;
    }

    // Trim description length
    if (data.description.length >= 220)
      data.description = data.description.substring(0, 220) + " [...]";

    console.table(data);

    // Build Embed
    const embedMessage = new EmbedBuilder()
      .setTitle(data.title)
      .setDescription(data.description)
      .setURL(data.url)
      .setAuthor({
        name: data.displayName,
        iconURL: data.profilePictureUrl,
        url: data.userUrl,
      })
      //.setThumbnail( data.repoImage )
      .setTimestamp()
      .setFooter({
        text: `Repo: [${data.repoFullname}]`,
        iconURL: data.repoImage,
      });

    // Add labels
    if (
      eventData &&
      "labels" in eventData &&
      Array.isArray(eventData.labels) &&
      eventData.labels.length > 0
    ) {
      for (const label of eventData.labels) {
        embedMessage.addFields({ name: "Label", value: label.name });
      }
    }

    // Add Assignees
    if (
      eventData &&
      "assignees" in eventData &&
      Array.isArray(eventData.assignees) &&
      eventData.assignees.length > 0
    ) {
      for (const assignee of eventData.assignees) {
        embedMessage.addFields({ name: "Assignee", value: assignee.login });
      }
    }

    return embedMessage;
  }

  /** Generates the embed for streamOnline message
   *
   * @param {StreamData} streamData Current Stream data
   */
  public generateStreamOnlineMessageEmbed(
    streamData: StreamData
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(streamData.streamTitle)
      .setDescription(streamData.streamDescription || "-")
      .setURL(streamData.streamUrl)
      .setAuthor({
        name: streamData.displayName,
        iconURL: streamData.profilePictureUrl,
        url: streamData.streamUrl,
      })
      .setImage(streamData.streamThumbnailUrl)
      .setThumbnail(streamData.profilePictureUrl)
      .setTimestamp()
      .setFooter({
        text: `Stream gestartet`,
        iconURL: streamData.profilePictureUrl,
      });
  }
}
