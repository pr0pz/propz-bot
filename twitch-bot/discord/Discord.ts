/**
 * Discord Controller
 *
 * @author Wellington Estevo
 * @version 1.7.18
 */

import '@propz/prototypes.ts';

import { getMessage, log } from '@propz/helpers.ts';
import { Client, GatewayIntentBits } from 'discord.js';
import { DiscordUtils } from './DiscordUtils.ts';

import type { StreamData } from '@propz/types.ts';
import type { Attachment, AttachmentBuilder, Channel, Collection, EmbedBuilder, ForumChannel, ForumThreadChannel, Guild, GuildForumThreadCreateOptions, GuildMember, Interaction, Message, Snowflake } from 'discord.js';
import type { BotData } from '../bot/BotData.ts';

export class Discord extends DiscordUtils
{
	public client: Client;

	// Configure your Discord data here
	private guildid = '693476252669050951';
	public channels: Record<string, string> = {
		channelAnnouncements: '931501580996444160',
		channelGithub: '1135575392258899978',
		channelStream: '1181683702430978048',
		channelTest: '1111209160521023520',
		channelWelcome: '960223627079454760',
		forumCodeTalk: '1199061906317660300',
		forumDesignTalk: '1199063282405879910'
	};

	// https://discord.com/api/oauth2/authorize?client_id=&permissions=28478049614912&scope=bot
	private intents: GatewayIntentBits[] = [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.MessageContent
	];

	constructor( private data: BotData )
	{
		super();
		this.client = new Client( { intents: this.intents } );
		this.handleClientEvents();
	}

	/** Connect Discord Bot */
	async connect()
	{
		const token = Deno.env.get( 'DISCORD_BOT_TOKEN' );
		if ( !token )
		{
			log( 'No Discord token found' );
			return;
		}

		try
		{
			await this.client.login( token );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Add all client listeners */
	handleClientEvents()
	{
		this.client.on( 'clientReady', this.onClientReady );
		this.client.on( 'messageCreate', this.onMessageCreate );
		this.client.on( 'message', this.onMessage );
		this.client.on( 'interactionCreate', this.onInteractionCreate );
		this.client.on( 'guildMemberAdd', this.onGuildMemberAdd );
	}

	/** Get guild by id
	 *
	 * @param {string} guildId Guild id to get
	 */
	private async getGuildById( guildId: string ): Promise<Guild | undefined>
	{
		if ( !guildId ) return;
		try
		{
			let guild = this.client.guilds.cache.find( ( guild ) => guild.id === guildId );

			if ( !guild )
				guild = await this.client.guilds.fetch( guildId );

			return guild;
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Get channel by id
	 *
	 * @param {string} channelId Channel id to get
	 */
	private async getChannelById( channelId: string ): Promise<Channel | undefined | null>
	{
		if ( !channelId ) return;
		try
		{
			let channel: Channel | undefined | null = this.client.channels.cache.find( ( channel: Channel ) =>
				channel.id === channelId
			);

			if ( !channel )
				channel = await this.client.channels.fetch( channelId );

			return channel;
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Send Discord message
	 *
	 * @param {String} channelId Send to this channel
	 * @param {String} messageText Message to send
	 */
	private async sendMessage( channelId: string, messageText: string )
	{
		if ( !channelId || !messageText ) return;

		// Get right channel
		const channel = await this.getChannelById( channelId );
		if ( !channel || !channel.isSendable() ) return;

		try
		{
			await channel.send( messageText );
			const channelName = 'name' in channel ? channel.name : channel.type;
			log( `<${channelName}> ${messageText}` );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Send Discord Embed
	 *
	 * @param {String} channelId Send to this channel
	 * @param {EmbedBuilder} embed to send
	 * @param {String} messageText Optional text message
	 */
	private async sendEmbed( channelId: string, embed: EmbedBuilder, messageText: string = '' )
	{
		if ( !channelId || !embed ) return;

		// Get right channel
		const channel = await this.getChannelById( channelId );
		if ( !channel || !channel.isSendable() ) return;

		try
		{
			await channel.send( {
				content: messageText,
				embeds: [ embed ]
			} );
			const channelName = 'name' in channel ? channel.name : channel.type;
			log( `<${channelName}> ${messageText}` );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Send Discord Attachment
	 *
	 * @param {string} channelId Send to this channel
	 * @param {Attachment|AttachmentBuilder} attachment Attachment to send
	 * @param {string} messageText Optional text message
	 */
	private async sendAttachment( channelId: string, attachment: Attachment | AttachmentBuilder,
		messageText: string = '' )
	{
		if ( !channelId || !attachment ) return;

		// Get right channel
		const channel = await this.getChannelById( channelId );
		if ( !channel || !channel.isSendable() ) return;

		try
		{
			await channel.send( {
				content: messageText,
				files: [ attachment ]
			} );
			const channelName = 'name' in channel ? channel.name : channel.type;
			log( `<${channelName}> ${messageText}` );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Create post in Forum
	 *
	 * @param {string} channelId Channel id
	 * @param {String} title
	 * @param {string} message
	 * @returns {Promise<ForumThreadChannel|undefined>}
	 */
	async createPost( channelId: string, title: string, message: string ): Promise<ForumThreadChannel | undefined>
	{
		if ( !channelId || !title || !message ) return;

		let channel = await this.getChannelById( channelId );
		if ( !channel ) return;
		channel = channel as ForumChannel;

		// Get right tag
		const tagTwitchQuestion = channel.availableTags.find( ( tag ) => tag.name === 'twitch-question' );
		if ( !tagTwitchQuestion ) return;

		try
		{
			const threadOptions: GuildForumThreadCreateOptions = {
				name: title,
				message: { content: message },
				appliedTags: [ tagTwitchQuestion.id ]
			};
			const threadChannel = await channel.threads.create( threadOptions );
			log( `<${channel.name}> ${title}: ${message}` );
			return threadChannel;
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Send Stream online message
	 *
	 * @param {StreamData} streamData Stream data
	 */
	sendStreamOnlineMessage( streamData: StreamData )
	{
		if ( !streamData ) return;
		try
		{
			const embedData = this.generateStreamOnlineMessageEmbed( streamData );
			const channelToSend = streamData.test ? this.channels.channelTest : this.channels.channelAnnouncements;
			void this.sendEmbed( channelToSend, embedData, streamData.streamAnnouncementMessage );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Process Github Event
	 *
	 * @param {string} eventName Github event name
	 * @param {any} githubData Github event data
	 */
	handleGithubEvent( eventName: string, githubData: any )
	{
		if ( !eventName || !githubData || !this.client.isReady() ) return;

		const embedData = this.generateGithubEmbed( eventName, githubData );
		if ( !embedData ) return;

		try
		{
			void this.sendEmbed( this.channels.channelGithub, embedData );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Send welcome image
	 *
	 * @param {GuildMember} member Member who needs a welcome message
	 * @param {boolean} test If testing function
	 */
	private async sendWelcomeImage( member: GuildMember, test: boolean = false )
	{
		if ( !member ) return;
		log( member.displayName );

		const eventType = 'guildmemberadd';
		const event = this.data.discordEvents.get( eventType );

		if ( !event?.message?.de || !event?.messageImage?.de ) return;

		const message = getMessage( event.message, 'de' ).replace( '[user]', member.displayName );
		const messageImage = getMessage( event.messageImage, 'de' );

		// Create welcome image attachment
		const attachmentImage = await this.generateWelcomeImageAttachment( member, messageImage );
		if ( !attachmentImage ) return;

		if ( test )
		{
			void this.sendAttachment( this.channels.channelTest, attachmentImage, message );
			return;
		}
		void this.sendAttachment( this.channels.channelWelcome, attachmentImage, message );
	}

	/** Discord bot successfully connected */
	onClientReady = ( client: Client ) =>
	{
		log( client?.user?.tag || 'x' );
	};

	/** When someone writes a message */
	onMessageCreate = async ( message: Message ) =>
	{
		if ( !message ) return;

		log( `<${message.author.tag}> '${message.content}'` );
		if ( message?.author?.tag !== 'pr0pz' ) return;

		// Handle commands
		const splittedMessage: string[] = message.content.split( ' ' );
		if ( message.content.startsWith( '!welcome' ) && splittedMessage[1] )
		{
			const guild: Guild | undefined = await this.getGuildById( this.guildid );
			if ( !guild ) return;

			try
			{
				const members: Collection<Snowflake, GuildMember> = await guild.members.fetch( {
					query: splittedMessage[1],
					limit: 1
				} );
				if ( !members ) return;

				const member: [ string, GuildMember ] | undefined = members.entries().next().value;
				if ( !member?.[1] ) return;

				void this.sendWelcomeImage( member[1] as GuildMember );
			}
			catch ( error: unknown ) { log( error ) }
		}
	};

	/** When someone writes a message */
	onMessage = ( message: Message ) =>
	{
		if ( !message ) return;
		log( `PM <${message.author.tag}>: '${message.content}'` );
		if ( !message.author.bot ) message.author.send( 'ok ' + message.author.id );
	};

	/** On command interaction */
	onInteractionCreate = async ( interaction: Interaction ) =>
	{
		if ( !interaction || !interaction.isChatInputCommand() ) return;
		log( interaction );

		if ( interaction.commandName === 'ping' )
			await interaction.reply( 'Pong!' );
	};

	/** When a new member joins our server */
	onGuildMemberAdd = ( member: GuildMember ) =>
	{
		if ( !member?.guild ) return;

		const eventType = 'guildmemberadd';
		log( `<${eventType}> ${member.displayName}` );

		void this.sendWelcomeImage( member );
	};
}
