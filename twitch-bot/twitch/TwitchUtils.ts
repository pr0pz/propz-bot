/**
 * Twitch Utils
 *
 * @author Wellington Estevo
 * @version 1.7.5
 */

import '@propz/prototypes.ts';

import { getMessage, getRandomNumber, getTimePassed, log } from '@propz/helpers.ts';
import { HelixUser } from '@twurple/api';
import { ChatUser, parseChatMessage } from '@twurple/chat';
import cld from 'cld';
import { Deepl } from '../external/Deepl.ts';
import { StreamElements } from '../external/StreamElements.ts';
import { Youtube } from '../external/Youtube.ts';
import { TwitchChat } from './TwitchChat.ts';
import { TwitchCommands } from './TwitchCommands.ts';
import { TwitchEvents } from './TwitchEvents.ts';

import type { ApiRequest, ApiResponse, KofiData, SimpleUser, StreamData, StreamDataApi, StreamElementsViewerStats, TwitchJoke, TwitchQuote, TwitchUserData } from '@propz/types.ts';
import type { HelixStream } from '@twurple/api';
import type { ChatMessage } from '@twurple/chat';
import type { BotData } from '../bot/BotData.ts';
import type { BotWebsocket } from '../bot/BotWebsocket.ts';
import type { Discord } from '../discord/Discord.ts';

export abstract class TwitchUtils
{
	// Controllers
	public chat: TwitchChat;
	public events: TwitchEvents;
	public commands: TwitchCommands;

	// Runtime vars
	public isDev: boolean = false;
	public focus: boolean = false;
	public stream: HelixStream | null = null;
	public firstChatter = '';
	public killswitch: boolean = false;
	private validMessageThreshold: number = 5;

	protected constructor(
		public data: BotData,
		public discord: Discord,
		public ws: BotWebsocket
	)
	{
		this.chat = new TwitchChat( this );
		this.events = new TwitchEvents( this );
		this.commands = new TwitchCommands( this );

		// Running localy for testing?
		if ( Deno.args?.[0]?.toString() === 'dev' )
		{
			this.isDev = true;
		}
	}

	/** Get the start time as timestamp */
	get streamStartTime()
	{
		return this.stream?.startDate.getTime() ?? 0;
	}

	/** Get current Stream language */
	get streamLanguage()
	{
		return this.stream?.language || 'de';
	}

	/** Returns if stream is active */
	get isStreamActive()
	{
		return this.stream !== null;
	}

	/** Set the current stream */
	async setStream(
		stream?: HelixStream | undefined | null
	): Promise<HelixStream | null>
	{
		if ( typeof stream !== 'undefined' )
		{
			return this.stream = stream;
		}
		try
		{
			this.stream = await this.data.twitchApi.streams.getStreamByUserName(
				this.data.userName
			);
			return this.stream;
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	/** Get watchtime command text
	 *
	 * @param {string} userName
	 * @param {string} message
	 */
	async getUserWatchtimeText( userName: string, message: string )
	{
		if ( !userName || !message )
			return '';

		const viewerStats: StreamElementsViewerStats | undefined = await StreamElements
			.getViewerStats( userName );

		if ( !viewerStats || !( 'watchtime' in viewerStats ) )
			return '';

		const watchtime = viewerStats.watchtime * 60 * 1000;

		message = message.replace( '[user]', userName );
		message = message.replace( '[broadcaster]', this.data.userDisplayName );
		message = message.replace( '[count]', getTimePassed( watchtime ) );
		message = message.replace( '[rank]', viewerStats.rank.toString() );

		return message;
	}

	/** Get user score: messages, firsts, follow
	 *
	 * @param {string} userName User to get score
	 * @param {string} message Message to search replace values
	 * @param {keyof TwitchUserData} type Type of score to get
	 */
	async getUserScoreText(
		userName: string,
		message: string,
		type: keyof TwitchUserData = 'message_count'
	)
	{
		if (
			!userName || !message || !type ||
			userName.toLowerCase() === this.data.userName
		) return '';

		const user = await this.data.getUser( userName );
		if ( !user ) return '';

		const usersData = this.data.getUsersData();
		if ( !usersData ) return '';

		let count: string | number = Number( usersData.get( user.id )?.[type] ) ?? 0;
		if ( !count ) return '';

		// Sort users by type
		const sortedUsers = usersData
			.entries()
			.filter( ( [ _user_id, user ] ) => user[type] as number > 0 )
			.map( ( [ user_id, user ] ) => [ user_id, user[type] as number, user.name ] )
			.toArray()
			.sort( ( a, b ) =>
			{
				// Aufsteigende Sortierung für 'follow'
				if ( type === 'follow_date' )
				{
					return ( a[1] as number ) - ( b[1] as number );
				}
				// Absteigende Sortierung für andere Typen
				else
				{
					return ( b[1] as number ) - ( a[1] as number );
				}
			} );

		const rank = sortedUsers.findIndex( ( [ id, _data, _userName ] ) => id === user.id ) + 1;

		if ( type === 'follow_date' )
			count = getTimePassed( Date.now() - count * 1000 );

		message = message.replace( '[user]', user.displayName );
		message = message.replace( '[count]', count.toString() );
		message = message.replace( '[rank]', rank.toString() );
		message = message.replace( '[broadcaster]', this.data.userDisplayName );

		return message;
	}

	/** Check and set firstchatter of each stream
	 *
	 * @param {SimpleUser} user user data
	 */
	setStreamFirstChatter( user: SimpleUser )
	{
		if (
			this.firstChatter ||
			user?.name === this.data.userName
		) return;

		this.firstChatter = user.displayName;
		this.data.updateUserData( user, 'first_count' );
		this.data.updateStreamStats( user, 'first_chatter' );

		this.processEvent( {
			eventType: 'firstchatter',
			user: user.displayName
		} );
	}

	/** Check for chat score
	 *
	 * @param {HelixUser} user User Object to check for
	 */
	checkChatScore( user: SimpleUser )
	{
		if ( user?.name === this.data.userName )
			return;

		const chatscores = [
			100,
			500,
			1000,
			2000,
			3000,
			4000,
			5000,
			6000,
			7000,
			8000,
			9000,
			10000
		];
		const count = this.data.getUserData( user.id! )?.message_count || 0;
		if ( count && chatscores.includes( count ) )
		{
			this.processEvent( {
				eventType: 'chatscore-' + count,
				user: user,
				eventCount: count
			} );
		}
	}

	/** Add Quote
	 *
	 * @param {string} chatMessage Original chat message object
	 * @returns {string}
	 */
	addJoke( chatMessage: ChatMessage ): string
	{
		if ( !chatMessage.isReply )
			return 'Error › Use !addjoke only as message reply';

		if ( !chatMessage.parentMessageText )
			return 'Error › Quote text is empty';

		if ( !chatMessage.parentMessageUserId )
			return 'Error › Invalid Author';

		const joke: TwitchJoke = {
			text: chatMessage.parentMessageText.sanitize(),
			user_id: chatMessage.parentMessageUserId.sanitize()
		};

		const logText = `t: ${joke.text} / u: ${joke.user_id}`;
		log( logText );
		// return logText;

		const lastId = this.data.addJoke( joke );

		return getMessage(
			this.commands.commands.get( 'addjoke' )?.message,
			this.streamLanguage
		).replace( '[count]', lastId );
	}

	/** Add Quote
	 *
	 * @param {string} chatMessage Original chat message object
	 * @returns {Promise<string>}
	 */
	async addQuote( chatMessage: ChatMessage ): Promise<string>
	{
		if ( !chatMessage.isReply )
			return 'Error › Use !addquote only as message reply';

		if ( !chatMessage.parentMessageText )
			return 'Error › Quote text is empty';

		if ( !chatMessage.parentMessageUserId )
			return 'Error › Invalid Author';

		const videoId = await Youtube.getCurrentLivestreamVideoId();
		const videoTimestamp = Math.floor( ( Date.now() - this.streamStartTime ) / 1000 ) - 20;

		const quote: TwitchQuote = {
			date: new Date().toISOString(),
			category: this.stream?.gameName || '',
			text: chatMessage.parentMessageText.sanitize(),
			user_id: chatMessage.parentMessageUserId.sanitize(),
			vod_url: Youtube.getYoutubeVideoUrlById( videoId, videoTimestamp )
		};

		const logText =
			`cat: ${quote.category} / t: ${quote.text} / u: ${quote.user_id} / vidid: ${videoId} / vidt: ${videoTimestamp} / vod: ${quote.vod_url}`;
		log( logText );
		// return logText;

		const lastId = this.data.addQuote( quote );

		return getMessage(
			this.commands.commands.get( 'addquote' )?.message,
			this.streamLanguage
		).replace( '[count]', lastId );
	}

	/** Search and replace emotes with images tags on chat message.
	 *
	 * @param {string} message Message to search and replace
	 * @param {ChatMessage} msg message object
	 * @returns {string} Modlist with all nicknames
	 */
	searchReplaceEmotes( message: string, msg: ChatMessage ): string
	{
		if ( !message || !msg )
			return '';

		const emotes = this.data.emotes;
		if ( !emotes ) return '';

		const parsedMessage = parseChatMessage( message, msg.emoteOffsets );
		const messageParts = [];

		for ( const [ _index, messagePart ] of parsedMessage.entries() )
		{
			if ( messagePart.type === 'text' )
			{
				messageParts.push( messagePart.text );
				continue;
			}

			// Replace known Emotes
			if ( emotes.has( messagePart.name ) )
			{
				messageParts.push(
					`<img src='${
						emotes.get( messagePart.name )
					}' alt='${messagePart.name}' class='emote emote-known' />`
				);
			}
			// Replace unknown Emotes
			else if ( messagePart.type === 'emote' )
			{
				messageParts.push(
					`<img src='https://static-cdn.jtvnw.net/emoticons/v2/${messagePart.id}/static/dark/3.0' alt='${messagePart.name}' class='emote emote-unknown' />`
				);
			}
		}

		let messageWithEmotes = messageParts.join( ' ' );

		// Replace all External Emotes
		messageWithEmotes = messageWithEmotes.split( ' ' ).map( ( word ) =>
			emotes.has( word ) ?
				`<img src='${emotes.get( word )}' alt='${word}' class='emote emote-external' />` :
				word
		).join( ' ' );

		return messageWithEmotes;
	}

	/** Check if is valid text message for stats.
	 *
	 * @param {string} message Message to search and replace
	 * @param {ChatMessage} msg Message object
	 */
	isValidMessageText( message: string, msg: ChatMessage )
	{
		if ( !message || !msg )
			return false;

		const emotes = this.data.emotes;
		if ( !emotes ) return false;

		const parsedMessage = parseChatMessage( message, msg.emoteOffsets );
		const messageParts = [];

		for ( const messagePart of parsedMessage )
		{
			// Check if its normal text and not external emote
			if ( messagePart.type === 'text' && messagePart.text !== ' ' )
			{
				messageParts.push( messagePart.text );
			}
		}

		if (
			!messageParts.length ||
			messageParts.join( ' ' ).length < this.validMessageThreshold
		) return false;

		const messageWithEmotes = [];
		for ( const word of messageParts.join( ' ' ).split( ' ' ) )
		{
			if ( !emotes.has( word ) )
			{
				messageWithEmotes.push( word );
			}
		}

		if (
			!messageWithEmotes.length ||
			messageWithEmotes.join( ' ' ).length < this.validMessageThreshold
		) return false;

		return true;
	}

	/** Send test event
	 *
	 * @param {string} eventMessage Whole chat message to parse
	 */
	sendTestEvent( eventMessage: string )
	{
		if ( !eventMessage ) return;

		const splittedMessage = eventMessage.split( ' ' );
		const eventType = splittedMessage[0];

		// Get username from random follower ...
		const followers = this.data.followers;
		let userName = followers[getRandomNumber( followers.length )].name ||
			this.data.userName;

		// ... or pritoritize from command if given
		if ( splittedMessage[1] )
		{
			userName = splittedMessage[1];
		}

		// Text message for TTS
		let message = '';
		if ( splittedMessage[2] )
		{
			message = splittedMessage.slice( 2 ).join( ' ' );
		}

		// Send random count number for specific event types
		const eventTypesWithCount = [
			'cheer',
			'chatscore-100',
			'chatscore-500',
			'chatscore-1000',
			'chatscore-2000',
			'chatscore-3000',
			'chatscore-4000',
			'chatscore-5000',
			'chatscore-6000',
			'chatscore-7000',
			'chatscore-8000',
			'chatscore-9000',
			'chatscore-10000',
			'communitysub',
			'communitysub-2',
			'kofidonation',
			'kofishoporder',
			'kofisubscription',
			'raid',
			'resub-1',
			'resub-2',
			'resub-3',
			'subgift'
		];
		let count = parseInt( splittedMessage[2] || '0' );
		if ( !count && eventTypesWithCount.includes( eventType ) )
		{
			count = getRandomNumber( 50, 1 );
		}

		this.processEvent( {
			eventType: eventType,
			user: userName,
			eventCount: count,
			eventText: message,
			isTest: true
		} );
	}

	/** Get the current stream for API */
	getStreamApi(): StreamDataApi | undefined
	{
		const stream = this.stream;
		if ( !stream ) return;

		const streamData: StreamDataApi = {
			gameName: stream.gameName,
			startDate: stream.startDate.getTime() / 1000,
			thumbnailUrl: stream.thumbnailUrl,
			title: stream.title,
			language: stream.language
		};
		return streamData;
	}

	/** Toggle Killswitch status */
	toggleKillswitch( killswitchStatus?: boolean )
	{
		this.killswitch = typeof killswitchStatus !== 'undefined' ?
			Boolean( killswitchStatus ) :
			!this.killswitch;
	}

	/** Handle Focus Command
	 *
	 * @param {string|number} focusStatusOrTime Focus status or focus time
	 */
	handleFocus( focusStatusOrTime: string | number = 10 ): number
	{
		if ( !focusStatusOrTime ) return 0;

		if ( focusStatusOrTime === 'stop' )
		{
			this.toggleFocus( false );
			return 0;
		}

		if ( !focusStatusOrTime.isNumeric() ) return 0;

		focusStatusOrTime = parseInt( focusStatusOrTime.toString() );

		this.toggleFocus( true, focusStatusOrTime );
		setTimeout( () => this.toggleFocus( false ), focusStatusOrTime * 60 * 1000 );

		return focusStatusOrTime;
	}

	/** Toggle Focus status */
	async toggleFocus( focusStatus: boolean = false, focusTimer: number = 10 )
	{
		if (
			typeof focusStatus !== 'boolean' ||
			typeof focusTimer !== 'number'
		) return;

		this.focus = focusStatus;
		this.toggleRewardPause( focusStatus );
		const eventType = this.focus ? 'focusstart' : 'focusstop';

		this.processEvent( {
			eventType: eventType,
			user: await this.data.getUser() || this.data.userName,
			eventCount: focusTimer
		} );
	}

	/** Toggle Reward Status for focus blacklist rewards
	 *
	 * @param {boolean} focusStatus
	 */
	toggleRewardPause( focusStatus: boolean = false )
	{
		if ( typeof focusStatus !== 'boolean' ) return;

		try
		{
			for ( const [ rewardSlug, reward ] of Object.entries( this.data.rewards ) )
			{
				if ( !this.data.getEvent( rewardSlug ).disableOnFocus )
				{
					continue;
				}

				const rewardUpdateData = {
					title: reward.title,
					cost: reward.cost,
					isPaused: focusStatus
				};

				this.data.twitchApi.channelPoints.updateCustomReward(
					this.data.userId,
					reward.id.toString(),
					rewardUpdateData
				);
			}
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Send Stream Online Data to discord
	 *
	 * @param {HelixStream} stream Current Stream
	 */
	async sendStremOnlineDataToDiscord( stream?: HelixStream | undefined | null )
	{
		if ( !this.discord.client.isReady() ) return;

		stream = stream ? stream : this.stream;
		if ( !stream ) return;

		const user = await this.data.getUser();
		if ( !user ) return;

		const streamAnnouncementMessage = getMessage(
			this.data.getEvent( 'streamonline' ).message,
			this.streamLanguage
		).replace( '[user]', user.displayName ) ||
			`${user.displayName} ist jetzte live!`;

		const streamData: StreamData = {
			displayName: user.displayName,
			profilePictureUrl: user.profilePictureUrl,
			streamUrl: `https://twitch.tv/${user.name}/`,
			streamThumbnailUrl: stream?.thumbnailUrl ?
				stream.getThumbnailUrl( 800, 450 ) + `?id=${stream.id}` :
				`${Deno.env.get( 'PUBLIC_URL' )?.toString()}/assets/thumbnail-propz.jpg`,
			streamTitle: stream?.title ? stream.title : streamAnnouncementMessage,
			streamDescription: stream?.gameName ?
				stream.gameName :
				'Software & Game Development',
			streamAnnouncementMessage: streamAnnouncementMessage,
			test: !stream ? true : false
		};

		console.table( streamData );
		this.discord.sendStremOnlineMessage( streamData );
	}

	/** Get simple user data from ChatUser Object */
	async convertToSimplerUser(
		user: ChatUser | HelixUser | SimpleUser | string | null
	)
	{
		if ( !user ) return null;
		let color = '';

		if ( typeof user === 'string' )
		{
			user = await this.data.getUser( user );
		}

		if ( user instanceof ChatUser )
		{
			color = user.color || '';
			user = await this.data.getUser( user.userName );
		}

		if ( user instanceof HelixUser )
		{
			return {
				id: user.id,
				name: user.name,
				displayName: user.displayName,
				color: color || await this.data.getColorForUser( user.id ),
				isMod: this.data.mods.includes( user.name ),
				profilePictureUrl: user.profilePictureUrl
			} as SimpleUser;
		}

		return user;
	}

	/** Handle kofi event
	 *
	 * @param {KofiData} kofiData Webhook data passed from ko-fi.com
	 */
	handleKofiEvent( kofiData: KofiData ): number
	{
		if (
			!kofiData?.type ||
			!kofiData?.amount ||
			kofiData?.verification_token !== Deno.env.get( 'KOFI_TOKEN' )
		) return 400;

		log( `Webhook: Kofi ${kofiData.type}` );

		const type = 'kofi' + kofiData.type.trim().replace( ' ', '' ).toLowerCase();
		const name = kofiData.from_name || 'anonymous';

		this.processEvent( {
			eventType: type,
			user: name,
			eventCount: parseFloat( kofiData.amount ),
			eventText: kofiData.message || '',
			isTest: ( name == 'Jo Example' )
		} );

		return 200;
	}

	/** Check if event can be fired
	 *
	 * @param {string} eventType Event type name
	 * @param {string} userName User name
	 */
	fireEvent(
		eventType: string,
		user: HelixUser | SimpleUser | ChatUser | string | null
	)
	{
		if ( !eventType || !user )
			return false;

		const userName = this.getUsernameFromObject( user );
		if ( !userName ) return false;

		const event = this.data.getEvent( eventType );
		if ( !event ) return false;

		// Killswitch
		if (
			this.killswitch &&
			userName !== this.data.userName
		) return false;

		// Prevent chatscore events to fire multiple times
		const [ lastEvent ] = this.data.getLastEventsData( this.streamLanguage ).slice(
			0,
			1
		);
		if (
			lastEvent &&
			eventType.startsWith( 'chatscore' ) &&
			eventType === lastEvent.type &&
			userName.toLowerCase() === ( lastEvent.name?.toLowerCase() || '' )
		) return false;

		// Focus Mode
		if ( this.focus && event.disableOnFocus )
			return false;

		if ( this.data.isBot( userName ) )
			return false;

		return true;
	}

	/** Check if commands can be executed */
	fireCommand( chatMessage: string, userName: string )
	{
		if ( !chatMessage ) return false;

		const commandName = this.commands.getCommandNameFromMessage( chatMessage );
		const command = this.commands.commands.get( commandName );

		// No data for this command
		if ( !command ) return false;

		// Focus Mode
		if ( this.focus && command.disableOnFocus )
			return false;

		// Disable if Stream is offline
		if ( !this.isStreamActive && command.disableIfOffline )
			return false;

		// Check for mod properties
		if (
			command.onlyMods &&
			!this.data.mods.includes( userName ) &&
			userName !== this.data.userName
		) return false;

		if ( this.commands.isCommandInCooldown( commandName ) )
			return false;

		return true;
	}

	/** Check if message should be handled */
	fireMessage( channel: string, user: string, text: string, msg: ChatMessage )
	{
		if ( !channel || !user || !text || !msg )
			return false;

		// Not home channel
		if ( channel !== this.data.userName )
			return false;

		if ( this.data.isBot( user ) )
			return false;

		// Killswitch
		if ( this.killswitch && user.toLowerCase() !== this.data.userName )
			return false;

		return true;
	}

	/** Handle timed messages */
	handleTimers()
	{
		const minutesPassed = Math.floor(
			( Date.now() - this.streamStartTime ) / 1000 / 60
		).toString();
		const timer = this.data.timers.get( minutesPassed );
		if ( !timer ) return;

		const message = getMessage( timer.message, this.streamLanguage );
		if ( !message ) return;

		if ( timer.isAnnouncement )
		{
			this.chat.sendAnnouncement( message );
			return;
		}
		this.chat.sendAction( message );
	}

	/** Process question command/redemption (post to discord)
	 *
	 * @param {string} questionType Fragetyp (code, design)
	 * @param {string} questionText Fragetext
	 * @param {HelixUser} user Fragende Person
	 * @param {ChatMessage} msg Message Object
	 */
	handleQuestion(
		questionType: string,
		questionText: string,
		user: HelixUser | SimpleUser
	)
	{
		if (
			!questionType || !questionText || !user || !this.discord.client.isReady()
		) return;

		const command = this.commands.commands.get( questionType );
		if ( !command?.discord ) return;

		// Setup post data
		const title = questionText.replace( `${questionType} `, '' );
		const message = `${title}\n\r\n\rQuestion by **${user.displayName}** on Twitch.`;

		// Create Thread
		const channelId = this.discord.channels[command.discord];

		this.discord.createPost( channelId, title, message )
			.then( ( threadChannel ) =>
			{
				if ( threadChannel )
				{
					this.chat.sendAction(
						`Thread wurde zur Diskussion erstellt ▶️ ${threadChannel.url}`
					);
				}

				return true;
			} );
	}

	/** Get the right username */
	getUsernameFromObject( user: HelixUser | ChatUser | SimpleUser | string )
	{
		if ( !user ) return '';
		if ( typeof user === 'string' ) return user.toLowerCase();
		if ( user instanceof ChatUser ) return user.userName;
		return user.name;
	}

	/** Auto translate if needed
	 *
	 * @param {string} message
	 * @param {ChatMessage} msg
	 */
	async translateIfNeeded( message: string, msg: ChatMessage )
	{
		try
		{
			const result = await cld.detect( message, {
				bestEffort: true
			} );

			if ( result?.languages?.[0]?.code !== 'pt' )
			{
				return;
			}

			const translation = await Deepl.translate( message, this.streamLanguage );
			this.chat.sendMessage( translation, msg );
		}
		catch ( _error: unknown )
		{
			/* meh */
		}
	}

	/** Reload data */
	async reloadConfig()
	{
		// Reload config
		this.data.reloadConfig();

		try
		{
			// Dynamically import the module to bypass the cache
			const { TwitchCommands } = await import(
				`./TwitchCommands.ts?cache-bust=${Date.now()}`
			);
			this.commands = new TwitchCommands( this );
			log( 'Config reloaded ♻️' );
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	// Overrides
	// deno-lint-ignore no-unused-vars
	async processChatCommand( chatMessage: string, msg: ChatMessage )
	{}

	// deno-lint-ignore no-unused-vars
	async processChatMessage( chatMessage: string, msg: ChatMessage )
	{}

	// deno-lint-ignore no-unused-vars
	async processEvent( options: {
		eventType: string;
		user: HelixUser | SimpleUser | ChatUser | string;
		sender?: string;
		eventCount?: number;
		eventText?: string;
		isTest?: boolean;
	} )
	{}

	// deno-lint-ignore no-unused-vars
	async processApiCall( data: ApiRequest ): Promise<ApiResponse>
	{
		return await { data: false };
	}
}
