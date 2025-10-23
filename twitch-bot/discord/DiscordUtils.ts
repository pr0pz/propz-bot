/**
 * Discord Helper
 *
 * @author Wellington Estevo
 * @version 1.7.18
 */

import '@propz/prototypes.ts';
import puppeteer from 'puppeteer';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { log } from '@propz/helpers.ts';
import { Buffer } from 'node:buffer';

import type { GuildMember } from 'discord.js';
import type { GithubData, StreamData } from '@propz/types.ts';

export class DiscordUtils
{
	/** Generates welcome attachment
	 *
	 * @returns {Promise<AttachmentBuilder|null>}
	*/
	async generateWelcomeImageAttachment( member: GuildMember, message: string ): Promise<AttachmentBuilder|undefined>
	{
		if ( !member || !message ) return;
		try {
			let htmlContent = Deno.readTextFileSync( './twitch-bot/discord/DiscordWelcome.html' );
			const colors = [ 'red', 'green', 'yellow', 'beige', 'blue', 'purple' ];
			const splittedText = message.split( '|' );
			const avatarUrl = member.displayAvatarURL({ extension: 'jpg', size: 512 });

			htmlContent = htmlContent.replace( '[[user]]', member.displayName );
			htmlContent = htmlContent.replace( '[[color]]', colors[ Math.floor( Math.random() * ( colors.length -1 ) ) ] );
			htmlContent = htmlContent.replace( '[[text-1]]', splittedText[0] );
			htmlContent = htmlContent.replace( '[[text-2]]', splittedText[1] );
			htmlContent = htmlContent.replace( '[[avatar]]', avatarUrl );
			htmlContent = htmlContent.replace( '[[number]]', '#' + member.guild.memberCount );

			// Create Discord attachment
			log( 'generateWelcomeImage' );
			const attachmentImageBuffer = await this.generateWelcomeImage( htmlContent );
			if ( !attachmentImageBuffer ) return;

			log( 'AttachmentBuilder' );
			return new AttachmentBuilder( attachmentImageBuffer, { name: `welcome-${member.displayName}.png` } );
		}
		catch( error: unknown ) { log( error ) }
	}

	/** Creates html puppeteer stuff and generates screenshot
	 *
	 * @param {string} htmlContent
	 * @returns {Promise<Buffer | null>}
	 */
	private async generateWelcomeImage( htmlContent: string ): Promise<Buffer | undefined>
	{
		try {
			const puppeteerArgs = [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--single-process',
				'--disable-gpu'
			];

			const browser = await puppeteer.launch( { args: puppeteerArgs } );
			const page = await browser.newPage();

			void await page.setViewport({ width: 1920, height: 1080 });
			void await page.setContent( htmlContent, { waitUntil: 'load' } );
			const screenshotBuffer = await page.screenshot({ fullPage: true });

			await page.close();
			await browser.close();

			return Buffer.from( screenshotBuffer );
		}
		catch( error: unknown ) { log( error ) }
	}

	/** Generate Github event embed
	 *
	 * @param {string} eventName
	 * @param {any} githubData
	 * @returns {EmbedBuilder|undefined}
	 */
	generateGithubEmbed( eventName: string, githubData: any ): EmbedBuilder|undefined
	{
		if (
			!eventName ||
			!githubData?.repository?.full_name ||
			!githubData?.sender
		) return;

		let eventData: any;
		let eventTitle = '';
		let eventDescription = '';
		const allowedActions: string[] = [];

		const data: GithubData = {
			title: '',
			description: '',
			url: githubData.sender.html_url,
			displayName: githubData.sender.login,
			profilePictureUrl: githubData.sender.avatar_url,
			userUrl: githubData.sender.html_url,
			repoName: githubData.repository.name,
			repoFullname: githubData.repository.full_name,
			repoImage: githubData.repository.owner.avatar_url,
			repoUrl: githubData.repository.html_url,
			repoPrivate: githubData.repository.private
		};

		// Do only something on these events
		// https://docs.github.com/en/webhooks/webhook-events-and-payloads
		switch( eventName )
		{
			case 'fork':
				eventData = githubData[ 'fork' ];
				data.title = `[${ data.repoFullname }] New fork`;
				data.description = `${ data.displayName } just forked your repo to '${ eventData.full_name }'`;
				data.url = eventData.html_url;
				break;

			case 'issues':
				allowedActions.push( 'opened' );
				eventTitle = 'New issue';
				/*if ( githubData['action'] === 'closed' )
					eventTitle = 'Issue closed';
				else if ( githubData['action'] === 'reopened' )
					eventTitle = 'Issue reopened';*/

				eventData = githubData[ 'issue' ];
				data.title = `[${ data.repoFullname }] ${ eventTitle } › ${ eventData.title }`;
				data.description = eventData.body;
				data.url = eventData.html_url;
				data.displayName = eventData.user.login;
				data.profilePictureUrl = eventData.user.avatar_url;
				data.userUrl = eventData.user.html_url;

				if ( !allowedActions.includes( githubData['action'] ) )
					return;

				break;

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

			case 'release':
				allowedActions.push( 'published' );
				eventData = githubData[ 'release' ];
				data.title = `[${ data.repoFullname }] New release › ${ eventData.tag_name }`;
				data.description = eventData.body;
				data.url = eventData.html_url;

				if ( !allowedActions.includes( githubData['action'] ) )
					return;

				break;

			case 'push':
				eventData = githubData[ 'head_commit' ];
				data.title = `[${ data.repoFullname }] New Push`;
				data.description = eventData.message;

				if ( !data.repoPrivate )
					data.url = eventData.url;

				break;

			case 'star':
				eventTitle = githubData['action'] === 'created' ? 'New Star added' : 'Star removed';
				data.title = `[${ data.repoFullname }] ${ eventTitle }`;

				eventDescription = githubData['action'] === 'created' ? 'just starred' : 'just unstarred'
				data.description = `${ data.displayName } ${ eventDescription } '${ data.repoName }'`;

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
		if ( data.description.length >= 220 )
			data.description = data.description.substring( 0, 220 ) + ' [...]';

		console.table( data );

		// Build Embed
		const embedMessage = new EmbedBuilder()
			.setTitle( data.title )
			.setDescription( data.description )
			.setURL( data.url )
			.setAuthor({
				name: data.displayName,
				iconURL: data.profilePictureUrl,
				url: data.userUrl
			})
			//.setThumbnail( data.repoImage )
			.setTimestamp()
			.setFooter({
				text: `Repo: [${data.repoFullname}]`,
				iconURL: data.repoImage
			});

		// Add labels
		if ( eventData.labels?.length > 0 )
		{
			for ( const label of eventData.labels )
			{
				embedMessage.addFields( { name: 'Label', value: label.name } );
			}
		}

		// Add Assignees
		if ( eventData.assignees?.length > 0 )
		{
			for ( const assignee of eventData.assignees )
			{
				embedMessage.addFields( { name: 'Assignee', value: assignee.login } );
			}
		}

		return embedMessage;
	}

	/** Generates the embed for streamOnline message
	 *
	 * @param {any} streamData Current Stream data
	 */
	generateStreamOnlineMessageEmbed( streamData: StreamData )
	{
		return new EmbedBuilder()
			.setTitle( streamData.streamTitle )
			.setDescription( streamData.streamDescription || '-' )
			.setURL( streamData.streamUrl )
			.setAuthor({
				name: streamData.displayName,
				iconURL: streamData.profilePictureUrl,
				url: streamData.streamUrl
			})
			.setImage( streamData.streamThumbnailUrl )
			.setThumbnail( streamData.profilePictureUrl )
			.setTimestamp()
			.setFooter({
				text: `Stream gestartet`,
				iconURL: streamData.profilePictureUrl
			});
	}
}
