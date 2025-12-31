import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { dirname, fromFileUrl, join } from "@std/path";

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

type RenderTemplateToPng = (opts: RenderTemplateToPngOptions) => Promise<void>;

type HtmlToImageModule = {
  renderTemplateToPng?: RenderTemplateToPng;
  default?: RenderTemplateToPng | { renderTemplateToPng?: RenderTemplateToPng };
};

const WELCOME_IMAGE_WIDTH = 1920;
const WELCOME_IMAGE_HEIGHT = 1080;

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

async function fetchAsDataUri(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const contentType =
      res.headers.get("content-type") ?? "application/octet-stream";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return undefined;
  }
}

async function main() {
  let mod: HtmlToImageModule | undefined;
  try {
    const require = createRequire(import.meta.url);
    mod = require("@grouvie/html-to-image") as HtmlToImageModule;
  } catch {
    throw new Error(
      "Couldn't load @grouvie/html-to-image (run `npm install github:grouvie/html_to_image`?)"
    );
  }
  const renderTemplateToPng = resolveRenderTemplateToPng(mod);
  if (!renderTemplateToPng) {
    throw new Error(
      "Couldn't load @grouvie/html-to-image (run `npm install github:grouvie/html_to_image`?)"
    );
  }

  const here = dirname(fromFileUrl(import.meta.url));
  const templatePath = join(here, "..", "discord", "DiscordWelcome.html");
  const outPath = join(here, "welcome-test.png");

  const avatarUrl =
    Deno.args[0] ?? "https://cdn.discordapp.com/embed/avatars/0.png?size=256";
  const avatar = (await fetchAsDataUri(avatarUrl)) ?? avatarUrl;

  await renderTemplateToPng({
    templatePath,
    outPath,
    width: WELCOME_IMAGE_WIDTH,
    height: WELCOME_IMAGE_HEIGHT,
    data: {
      color: "purple",
      user: "TestUser",
      text_1: "Hi & Willkommen",
      text_2: "im Kreativ-Paradies",
      avatar,
      number: "#123",
    },
  });

  console.log(`Wrote ${outPath}`);
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error);
    Deno.exit(1);
  });
}
