/**
 * Twitch Utils
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import {
	type ApiClient,
	type CommercialLength,
	type HelixStream,
	HelixUser
} from '@twurple/api';

import { type ChatMessage, ChatUser, parseChatMessage } from '@twurple/chat';

import type {
	StreamData,
	StreamDataApi,
	StreamElementsError,
	StreamElementsViewerStats,
	TwitchQuote,
	TwitchUserData,
	TwitchEventData,
	ApiRequest,
	ApiResponse,
	SimpleUser,
	KofiData
} from '@propz/types.ts';

import '@propz/helpers.ts';
import { getMessage, getRandomNumber, getTimePassed, log } from '@propz/helpers.ts';
import type { Discord } from '../discord/Discord.ts';
import { Youtube } from '../external/Youtube.ts';
import { StreamElements } from '../external/StreamElements.ts';
import type { BotData } from '../bot/BotData.ts';
import type { BotWebsocket } from '../bot/BotWebsocket.ts';
import { TwitchChat } from './TwitchChat.ts';
import { TwitchEvents } from './TwitchEvents.ts';
import { TwitchCommands } from './TwitchCommands.ts';

export abstract class TwitchUtils
{
	// Controllers
	public api: ApiClient;
	public data: BotData;
	public discord: Discord;
	public ws: BotWebsocket;
	public chat: TwitchChat;
	public events: TwitchEvents;
	public commands: TwitchCommands;
	
	// Runtime vars
	public isTesting: boolean = false;
	public focus: boolean = false;
	public streamFirstChatter: string = '';
	public stream: HelixStream|null = null;
	private validMessageThreshold: number = 5;
	public killswitch: boolean = false;

	constructor( data: BotData, discord: Discord, ws: BotWebsocket )
	{
		this.data = data;
		this.discord = discord;
		this.ws = ws;
		this.api = data.twitchApi;

		this.chat = new TwitchChat( this );
		this.events = new TwitchEvents( this );
		this.commands = new TwitchCommands( this );
		
		this.setStreamFirstChatter( this.data.userName );

		// Running localy for testing?
		if ( Deno.args?.[0]?.toString() === 'test' )
			this.isTesting = true;
	}

	/** Set the current stream */
	async setStream( stream?: HelixStream|undefined|null ): Promise<HelixStream | null>
	{
		if ( typeof stream !== 'undefined' ) return this.stream = stream;
		try
		{
			this.stream = await this.data.twitchApi.streams.getStreamByUserName( this.data.userName );
			return this.stream;
		}
		catch( error: unknown ) {
			log( error );
			return null;
		}
	}

	/** Start Twitch Ads
	 * 
	 * @param {number} length Ad length in seconds (30, 60, 90, 120, 150, 180)
	 */
	async startAds( length: CommercialLength = 180 )
	{
		if ( !this.isStreamActive || !length ) return;
		this.data.twitchApi.channels.startChannelCommercial( this.data.userId, length );

		this.processEvent({
			eventType: 'adbreak',
			user: await this.data.getUser() || this.data.userName,
			eventCount: length
		});
	}

	/** Start twitch Raid */
	async startRaid( targetUserName: string )
	{
		if ( !this.isStreamActive || !targetUserName ) return;

		const target = await this.data.getUser( targetUserName );
		if ( !target ) return;

		const raid = await this.data.twitchApi.raids.startRaid( this.data.userId, target.id );
		if ( !raid ) return;
	
		this.processEvent({
			eventType: 'startraid',
			user: target
		});
	}

	/** Get the start time as timestamp */
	get streamStartTime() { return this.stream?.startDate.getTime() ?? 0; }

	/** Get current Stream language */
	get streamLanguage() { return this.stream?.language || 'de'; }
	
	/** Returns if stream is active */
	get isStreamActive() { return this.stream !== null; }

	/** Get Stream uptime as text */
	getStreamUptimeText( message: string )
	{
		if ( !this.isStreamActive || !message ) return '';
		const timeDiff = Date.now() - this.streamStartTime;
		message = message.replace( '[count]', getTimePassed( timeDiff ) );
		return message;
	}

	/** Get watchtime command text
	 * 
	 * @param {string} userName 
	 * @param {string} message
	 */
	async getUserWatchtimeText( userName: string, message: string )
	{
		if ( !userName || !message ) return '';
		const viewerStats: StreamElementsViewerStats|StreamElementsError|undefined = await StreamElements.getViewerStats( userName );

		if ( !viewerStats || !('watchtime' in viewerStats) ) return '';

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
	async getUserScoreText( userName: string, message: string , type: keyof TwitchUserData = 'messages' )
	{
		if (
			!userName || !message || !type ||
			userName.toLowerCase() === this.data.userName
		) return '';

		const user = await this.data.getUser( userName );
		if ( !user ) return '';

		const userData = this.data.getUsersData();
		if ( !userData ) return '';

		let count: string|number = Number( userData[ user.id ][ type ] ) ?? 0;
		if ( !count ) return '';

		// Sort users by type
		const sortedUsers = Object.entries( userData )
			.filter( ([_, data]) => data[type] !== undefined )
			.sort( ([, a], [, b]) => 
			{
				// Aufsteigende Sortierung für 'follow'
				if ( type === 'follow' )
				{
					return (a[type] as number) - (b[type] as number);
				}
				// Absteigende Sortierung für andere Typen
				else
				{
					return (b[type] as number) - (a[type] as number);
				}
			});

		const rank = sortedUsers.findIndex( ( [id, _data] ) => id === user.id ) + 1;

		if ( type === 'follow' )
			count = getTimePassed( Date.now() - count * 1000 );

		message = message.replace( '[user]', user.displayName );
		message = message.replace( '[count]', count.toString() );
		message = message.replace( '[rank]', rank.toString() );
		message = message.replace( '[broadcaster]', this.data.userDisplayName );

		return message;
	}

	/** First chat message of each stream.
	 * 
	 * @param {string} userName Username for first chat message
	 */
	setStreamFirstChatter( userName: string )
	{
		if ( typeof userName !== 'string' ) return;
		this.streamFirstChatter = userName;
		if ( userName && userName !== this.data.userName )
		{
			this.processEvent({
				eventType: 'firstchatter',
				user: userName
			});
		}
	}
	
	/** Check for first chatter event.
	 * 
	 * @param {HelixUser} user User Object to check for
	 */
	checkFirstChatterEvent( user: SimpleUser )
	{
		if (
			this.streamFirstChatter ||
			user?.name === this.data.userName
		) return;
		
		this.setStreamFirstChatter( user.name );
		this.data.updateUserData( user, 'firsts', 1 );
	}

	/** Check for chat score
	 * 
	 * @param {HelixUser} user User Object to check for
	 */
	checkChatScore( user: SimpleUser )
	{
		if ( user?.name === this.data.userName ) return;

		const chatscores = [
			100, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000
		];
		const count = this.data.getUsersData( user.id! ).messages || 0;
		if ( count && chatscores.includes( count ) )
		{
			this.processEvent({
				eventType: 'chatscore-' + count,
				user: user,
				eventCount: count
			});
		}
	}

	/** Add Quote
	 * 
	 * @param {string} chatMessage Original chat message
	 * @returns {Promise<string>}
	 */
	async addQuote( chatMessage: string ): Promise<string>
	{
		if ( !this.isStreamActive || !chatMessage ) return '';

		const syntaxError = 'The correct syntax: !addquote USERNAME quote';

		const chatMessageSplitted = chatMessage.split( ' ' );
		if ( chatMessageSplitted.length < 2 )
			return syntaxError;

		let author: string|HelixUser|null = chatMessageSplitted[0] ?? '';
		if ( author === 'help' )
			return syntaxError;

		author = await this.data.getUser( author );
		// Couldnt find user, so assume the author is me
		chatMessageSplitted.splice( 0, !author ? 1 : 2 );
		author = author ? author.name : this.data.userDisplayName;

		const quoteText = chatMessageSplitted.join( ' ' );
		const videoId = await Youtube.getCurrentLivestreamVideoId();
		const videoTimestamp = Math.floor( ( Date.now() - this.streamStartTime ) / 1000 ) - 20;

		const quote: TwitchQuote = {
			date: new Date().toString(),
			category: this.stream?.gameName || '',
			quote: quoteText.sanitize(),
			user: author.sanitize(),
			vod: Youtube.getYoutubeVideoUrlById( videoId, videoTimestamp )
		};

		this.data.addQuote( quote );

		return getMessage( this.commands.commands.get( 'addquote' )?.message, this.streamLanguage ).replace( '[count]', String( this.data.quotes.length - 1 ) );
	}

	/** Search and replace emotes with images tags on chat message.
	 * 
	 * @param {string} message Message to search and replace
	 * @param {ChatMessage} msg message object
	 * @returns {string} Modlist with all nicknames
	 */
	searchReplaceEmotes( message: string, msg: ChatMessage ): string
	{
		if ( !message || !msg ) return '';

		const emotes = this.data.emotes;
		if ( !emotes ) return '';

		const parsedMessage = parseChatMessage( message, msg.emoteOffsets );
		const messageParts = [];

		for( const [_index, messagePart] of parsedMessage.entries() )
		{
			if ( messagePart.type === 'text' )
			{
				messageParts.push( messagePart.text );
				continue;
			}

			// Replace known Emotes
			if ( emotes[ messagePart.name ] )
			{
				messageParts.push( `<img src='${ emotes[ messagePart.name ] }' alt='${ messagePart.name }' class='emote emote-known' />` );
			}
			// Replace unknown Emotes
			else
			{
				messageParts.push( `<img src='https://static-cdn.jtvnw.net/emoticons/v2/${ emotes[ messagePart.name ] }/static/dark/3.0' alt='${ messagePart.name }' class='emote emote-unknown' />` );
			}
		}

		let messageWithEmotes = messageParts.join( ' ' );

		// Replace all External Emotes
		messageWithEmotes = messageWithEmotes.split(' ').map( word => emotes[word] ? `<img src='${ emotes[word] }' alt='${ word }' class='emote emote-external' />` : word ).join(' ');
		
		return messageWithEmotes;
	}

	/** Check if is valid text message for stats.
	 * 
	 * @param {string} message Message to search and replace
	 * @param {ChatMessage} msg Message object
	 */
	isValidMessageText( message: string, msg: ChatMessage )
	{
		if ( !message || !msg ) return false;

		const emotes = this.data.emotes;
		if ( !emotes ) return false;

		const parsedMessage = parseChatMessage( message, msg.emoteOffsets );
		const messageParts = [];

		for( const messagePart of parsedMessage )
		{
			// Check if its normal text and not external emote
			if ( messagePart.type === 'text' && messagePart.text !== ' ' )
				messageParts.push( messagePart.text );
		}

		if ( !messageParts.length || messageParts.join( ' ' ).length < this.validMessageThreshold )
			return false;

		const messageWithEmotes = [];
		for( const word of messageParts.join( ' ' ).split( ' ' ) )
		{
			if ( !emotes[ word ] )
				messageWithEmotes.push( word );
		}

		if ( !messageWithEmotes.length || messageWithEmotes.join( ' ' ).length < this.validMessageThreshold )
			return false;
		
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
		let userName = followers[ getRandomNumber( followers.length ) ].eventUsername || this.data.userName;

		// ... or pritoritize from command if given
		if ( splittedMessage[1] )
			userName = splittedMessage[1];

		// Text message for TTS
		let message = '';
		if ( splittedMessage[2] )
			message = splittedMessage.slice( 2 ).join( ' ' );

		// Send random count number for specific event types
		const eventTypesWithCount = [ 'cheer', 'chatscore-100', 'chatscore-500', 'chatscore-1000','chatscore-2000', 'chatscore-3000', 'chatscore-4000', 'chatscore-5000','chatscore-6000', 'chatscore-7000', 'chatscore-8000', 'chatscore-9000','chatscore-10000', 'communitysub', 'communitysub-2', 'kofidonation', 'kofishoporder', 'kofisubscription', 'raid', 'resub-1', 'resub-2', 'resub-3', 'subgift' ];
		let count = parseInt( splittedMessage[2] || '0' );
		if ( !count && eventTypesWithCount.includes( eventType ) )
			count = getRandomNumber( 50, 1 );

		this.processEvent({
			eventType: eventType,
			user: userName,
			eventCount: count,
			eventText: message,
			isTest: true
		});
	}

	/** Get the current stream for API */
	getStreamApi(): StreamDataApi|undefined
	{
		const stream = this.stream;
		if ( !stream ) return;

		const streamData: StreamDataApi = {
			gameName: stream.gameName,
			startDate: stream.startDate.getTime() / 1000,
			thumbnailUrl: stream.thumbnailUrl,
			title: stream.title,
			language: stream.language
		}
		return streamData;
	}

	/** Toggle Killswitch status */
	toggleKillswitch( killswitchStatus?: boolean )
	{
		this.killswitch = typeof killswitchStatus !== 'undefined' ? Boolean( killswitchStatus ) : !this.killswitch;	
	}

	/** Handle Focus Command
	 * 
	 * @param {string|number} focusStatusOrTime Focus status or focus time
	 */
	handleFocus( focusStatusOrTime: string|number = 10 ): number
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

		this.processEvent({
			eventType: eventType,
			user: await this.data.getUser() || this.data.userName,
			eventCount: focusTimer
		});
	}

	/** Toggle Reward Status for focus blacklist rewards
	 * 
	 * @param {boolean} focusStatus
	 */
	toggleRewardPause( focusStatus: boolean = false )
	{
		if ( typeof focusStatus !== 'boolean' ) return;
		for( const [rewardSlug, reward] of Object.entries( this.data.rewards ))
		{
			if ( !this.data.getEvent( rewardSlug ).disableOnFocus ) continue;

			const rewardUpdateData = {
				title: reward.title,
				cost: reward.cost,
				isPaused: focusStatus
			}

			this.data.twitchApi.channelPoints.updateCustomReward( this.data.userId, reward.id.toString(), rewardUpdateData );
		}
	}

	/** Send Stream Online Data to discord
	 * 
	 * @param {HelixStream} stream Current Stream
	 */
	async sendStremOnlineDataToDiscord( stream?: HelixStream|undefined|null )
	{
		stream = stream ? stream : this.stream;
		if ( !stream ) return;

		const user = await this.data.getUser();
		if ( !user ) return;

		const streamAnnouncementMessage = getMessage( this.data.getEvent( 'streamonline' ).message, this.streamLanguage ).replace( '[user]', user.displayName ) || `${user.displayName} ist jetzte live!`;
		
		const streamData: StreamData = {
			displayName: user.displayName,
			profilePictureUrl: user.profilePictureUrl,
			streamUrl: `https://twitch.tv/${ user.name }/`,
			streamThumbnailUrl: stream?.thumbnailUrl ? stream.getThumbnailUrl( 800, 450 ) + `?id=${ stream.id }` : `${ Deno.env.get( 'PUBLIC_URL' )?.toString() }/assets/thumbnail-propz.jpg`,
			streamTitle: stream?.title ? stream.title : streamAnnouncementMessage,
			streamDescription: stream?.gameName ? stream.gameName : 'Software & Game Development',
			streamAnnouncementMessage: streamAnnouncementMessage,
			test: !stream ? true : false
		}
		
		console.table( streamData );
		this.discord.sendStremOnlineMessage( streamData );
	}

	/** Get simple user data from ChatUser Object */
	async convertToSimplerUser( user: ChatUser|HelixUser|SimpleUser )
	{
		// Check for ChatUser and convert to HelixUser
		let color = '';
		if ( user instanceof ChatUser )
		{
			color = user.color || '';
			const userConverted = await this.data.getUser( user.userName );
			user = userConverted!;
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

		console.log( `Webhook: Kofi ${ kofiData.type }` );

		const type = 'kofi' + kofiData.type.trim().replace( ' ', '' ).toLowerCase();
		const name = kofiData.from_name || 'anonymous';

		this.processEvent({
			eventType: type,
			user: name,
			eventCount: parseFloat( kofiData.amount ),
			eventText: kofiData.message || '',
			isTest: ( name == 'Jo Example' )
		});

		return 200;
	}

	/** Check if event can be fired
	 * 
	 * @param {string} eventType Event type name
	 * @param {string} userName User name
	 */
	fireEvent( eventType: string, user: HelixUser|SimpleUser|ChatUser|string )
	{	
		if ( !eventType || !user )
			return false;

		const userName = this.getUsernameFromObject( user );
		if ( !userName )
			return false;

		const event = this.data.getEvent( eventType );
		if ( !event )
			return false;

		if ( this.data.isBot( userName ) )
			return false;

		// Killswitch
		if (
			this.killswitch &&
			userName !== this.data.userName
		) return false;
		
		// Prevent chatscore events to fire multiple times
		const lastEvent: TwitchEventData = this.data.getLastEventsData( this.streamLanguage ).slice(-1)[0];
		if (
			lastEvent &&
			eventType.startsWith( 'chatscore' ) &&
			eventType === lastEvent.eventType &&
			userName === lastEvent.eventUsername
		) return false;

		// Focus Mode
		if ( this.focus && event.disableOnFocus )
			return false;

		return true;
	}

	/** Check if commands can be executed */
	fireCommand( chatMessage: string, user: ChatUser|SimpleUser )
	{
		if ( !chatMessage || !user )
			return false;

		const commandName = this.commands.getCommandNameFromMessage( chatMessage );
		const command = this.commands.commands.get( commandName );

		// No data for this command
		if ( !command )
			return false;

		// Focus Mode
		if ( this.focus && command.disableOnFocus )
			return false;

		// Check for mod properties
		const userName = user instanceof ChatUser ? user.userName : user.name;
		if (
			command.onlyMods &&
			!user.isMod &&
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
		const minutesPassed = Math.floor( ( Date.now() - this.streamStartTime ) / 1000 / 60 );
		const message = getMessage( this.data.timers?.[ minutesPassed ]?.message, this.streamLanguage ) || '';

		if ( !minutesPassed || !message ) return;
		this.chat.sendAction( message );
	}

	/** Process question command/redemption (post to discord)
	 * 
	 * @param {string} questionType Fragetyp (code, design)
	 * @param {string} questionText Fragetext
	 * @param {HelixUser} user Fragende Person
	 * @param {ChatMessage} msg Message Object
	 */
	handleQuestion( questionType: string, questionText: string, user: HelixUser|SimpleUser )
	{
		if ( !questionType || !questionText || !user ) return;

		const command = this.commands.commands.get( questionType );
		if ( !command?.discord ) return;

		// Setup post data
		const title = questionText.replace( `${questionType} `, '' );
		const message = `${title}\n\r\n\rQuestion by **${ user.displayName }** on Twitch.`;

		// Create Thread
		const channelId = this.discord.channels[ command.discord ];

		this.discord.createPost( channelId, title, message )
			.then( threadChannel => {
				if ( threadChannel )
					this.chat.sendAction( `Thread wurde zur Diskussion erstellt ▶️ ${threadChannel.url}` );

				return true;
			});
	}

	/** Get the right username */
	getUsernameFromObject( user: HelixUser|ChatUser|SimpleUser|string )
	{
		if ( !user ) return '';
		if ( typeof user === 'string' )
			return user.toLowerCase();
		if ( user instanceof ChatUser )
			return user.userName;
		
		return user.name;
	}

	/** Reload data */
	async reloadData()
	{
		// Reload data
		await this.data.reloadData();

		try
		{
			// Dynamically import the module to bypass the cache
			const { TwitchCommands } = await import(`./TwitchCommands.ts?cache-bust=${Date.now()}`);
			this.commands = new TwitchCommands( this );
		}
		catch ( error: unknown ) { log( error ) }
	}

	// Overrides
	// deno-lint-ignore no-unused-vars
	async processChatCommand( chatMessage: string, sender: ChatUser|SimpleUser ){}
	// deno-lint-ignore no-unused-vars
	async processChatMessage( chatMessage: string, msg: ChatMessage ){}
	// deno-lint-ignore no-unused-vars
	async processEvent( options: {
		eventType: string,
		user: HelixUser|SimpleUser|ChatUser|string,
		eventCount?: number,
		eventText?: string,
		isTest?: boolean
	}){}
	// deno-lint-ignore no-unused-vars
	async processApiCall( data: ApiRequest ): Promise<ApiResponse> { return await { 'data': false } }
}