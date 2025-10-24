// deno-lint-ignore-file require-await
/**
 * Twitch Utils
 *
 * @author Wellington Estevo
 * @version 1.10.3
 */

import '@propz/prototypes.ts';

import {clearTimer, getMessage, getRandomNumber, getRewardSlug, getTimePassed, log} from '@propz/helpers.ts';
import type {HelixStream} from '@twurple/api';
import {HelixUser} from '@twurple/api';
import type {ChatMessage} from '@twurple/chat';
import {ChatUser, parseChatMessage} from '@twurple/chat';
import cld from 'cld';
import {Deepl} from '../modules/Deepl.ts';
import {StreamElements} from '../modules/StreamElements.ts';
import {Spotify} from '../modules/Spotify.ts';
import {TwitchChat} from './TwitchChat.ts';
import {TwitchCommands} from './TwitchCommands.ts';
import {TwitchEvents} from './TwitchEvents.ts';

import type {
	ApiRequest,
	ApiResponse,
	KofiData,
	SimpleUser,
	StreamData,
	StreamDataApi,
	StreamElementsViewerStats,
	TwitchUserData
} from '@propz/types.ts';
import type {BotData} from '../bot/BotData.ts';
import type {BotWebsocket} from '../bot/BotWebsocket.ts';
import type {Discord} from '../discord/Discord.ts';

export abstract class TwitchUtils
{
	// Controllers
	public chat: TwitchChat;
	public events: TwitchEvents;
	public commands: TwitchCommands;
	public spotify: Spotify

	// Runtime vars
	public isDev: boolean = false;
	public stream: HelixStream | null = null;
	public firstChatter = '';
	public killswitch: boolean = false;
	private focusTimer: number = 0;
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
		this.spotify = new Spotify( this.data.db );

		// Running localy for testing?
		this.isDev = ( Deno.args?.[0]?.toString() === 'dev' );
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

	/**
	 * Get ranking text for chat message
	 *
	 * @param {keyof } type
	 * @returns {string}
	 */
	getRankingText( type: keyof TwitchUserData = 'message_count' ): string
	{
		if ( !type ) return '';

		const usersData = this.data.getUsersData();
		if ( !usersData ) return '';

		// Sort users by type
		const sortedUsers = usersData
			.entries()
			.filter( ( [ _user_id, user ] ) => user[type] as number > 0 )
			.map( ( [ _user_id, user ] ) => [ user.name, user[type] as number, user.gift_count, user.raid_viewers ] )
			.toArray()
			.sort( ( a, b ) => ( b[1] as number ) - ( a[1] as number ) )
			.slice( 0, 10 );

		let message = '';
		for( let i = 0; i < sortedUsers.length; i++ )
		{
			// ×
			if ( message ) message += ' ||| ';
			message += `${i + 1}. @${sortedUsers[i][0]}: ${sortedUsers[i][1]}`

			if ( type === 'gift_subs' )
				message += ` subs (${sortedUsers[i][2]}x gifted)`;
			else if ( type === 'raid_count' )
				message += ` raids (${sortedUsers[i][3]} viewers)`;
			else if ( type === 'sub_count' )
				message += ` months`;
		}

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

		void this.processEvent( {
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
			void this.processEvent( {
				eventType: 'chatscore-' + count,
				user: user,
				eventCount: count
			} );
		}
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
				messageParts.push( `<span>${messagePart.text}</span>` );
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
		let userName = this.data.userName;

		// ... or prioritize from command if given
		if ( splittedMessage[1] )
			userName = splittedMessage[1];

		// Text message for TTS
		let message = '';
		if ( splittedMessage[2] )
			message = splittedMessage.slice( 2 ).join( ' ' );

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
			'communitysub-1',
			'communitysub-2',
			'communitysub-3',
			'communitysub-4',
			'communitysub-5',
			'communitysub-6',
			'communitysub-7',
			'kofidonation',
			'kofishoporder',
			'kofisubscription',
			'raid',
			'resub-1',
			'resub-2',
			'resub-3',
			'resub-4',
			'resub-5',
			'subgift'
		];
		let count = parseInt( splittedMessage[2] || '0' );
		if ( !count && eventTypesWithCount.includes( eventType ) )
			count = getRandomNumber( 50, 1 );

		void this.processEvent( {
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

		return {
			gameName: stream.gameName,
			startDate: stream.startDate.getTime() / 1000,
			thumbnailUrl: stream.thumbnailUrl,
			title: stream.title,
			language: stream.language
		} as StreamDataApi;
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
		if ( !focusStatusOrTime || !focusStatusOrTime.isNumeric() ) return 0;
		this.focusTimer = clearTimer( this.focusTimer );
		focusStatusOrTime = parseInt( focusStatusOrTime.toString() );
		this.focusTimer = setTimeout( () => this.toggleFocus( false ), focusStatusOrTime * 60 * 1000 );
		void this.toggleFocus( true, focusStatusOrTime );

		return focusStatusOrTime;
	}

	/** Toggle Focus status */
	async toggleFocus( focusStatus: boolean = false, focusTimer: number = 10 )
	{
		if (
			typeof focusStatus !== 'boolean' ||
			typeof focusTimer !== 'number'
		) return;

		this.toggleRewardPause( focusStatus );
		const eventType = focusStatus ? 'focusstart' : 'focusstop';

		void this.processEvent( {
			eventType: eventType,
			user: await this.data.getUser() || this.data.userName,
			eventCount: focusTimer
		} );

		// Clear timeout
		if ( !focusStatus && this.focusTimer )
			this.focusTimer = clearTimer( this.focusTimer );
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
			for ( const [ _index, reward ] of this.data.rewards.entries() )
			{
				const rewardSlug = getRewardSlug( reward.title );
				if ( !this.data.getEvent( rewardSlug ).disableOnFocus ) continue;

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
	async sendStreamOnlineDataToDiscord( stream?: HelixStream | undefined | null )
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
			`${user.displayName} ist jetzt live!`;

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
			test: !stream
		};

		console.table( streamData );
		this.discord.sendStreamOnlineMessage( streamData );
	}

	/** Get simple user data from ChatUser Object */
	async convertToSimplerUser(
		user: ChatUser | HelixUser | SimpleUser | string | null
	): Promise<SimpleUser | null>
	{
		if ( !user ) return null;
		let color = '';
		let isSub = false;
		let isVip = false;
		let newUser: ChatUser | HelixUser | SimpleUser | string | null = user;

		if ( typeof user === 'string' )
		{
			newUser = await this.data.getUser( user );
			// No user found? Probably kofi event
			if ( !newUser )
			{
				newUser = {
					name: user,
					displayName: user
				}
			}
		}

		if ( user instanceof ChatUser )
		{
			color = user.color || '';
			isSub = user.isSubscriber ?? false;
			isVip = user.isVip ?? false;
			newUser = await this.data.getUser( user.userName );
		}

		if ( newUser instanceof HelixUser )
		{
			return {
				id: newUser.id,
				name: newUser.name,
				displayName: newUser.displayName,
				color: color || await this.data.getColorForUser( newUser.id ),
				isMod: this.data.mods.includes( newUser.name ),
				isSub: isSub ?? false,
				isVip: isVip ?? false,
				isFollower: this.data.isFollower( newUser.id ),
				profilePictureUrl: newUser.profilePictureUrl,
			} as SimpleUser;
		}

		return newUser as SimpleUser;
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

		void this.processEvent( {
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
	 * @param {HelixUser|SimpleUser|ChatUser|string|null} user
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
			userName.toLowerCase() === ( lastEvent.user?.name?.toLowerCase() || '' )
		) return false;

		// Focus Mode
		if ( this.focusTimer && event.disableOnFocus )
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
		if ( this.focusTimer && command.disableOnFocus )
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
			void this.chat.sendAnnouncement( message );
			return;
		}
		void this.chat.sendAction( message );
	}

	/** Process question command/redemption (post to discord)
	 *
	 * @param {string} questionType Fragetyp (code, design)
	 * @param {string} questionText Fragetext
	 * @param {HelixUser} user Fragende Person
	 * @param {ChatMessage} msg Message Object
	 */
	// handleQuestion(
	// 	questionType: string,
	// 	questionText: string,
	// 	user: HelixUser | SimpleUser
	// )
	// {
	// 	if (
	// 		!questionType || !questionText || !user || !this.discord.client.isReady()
	// 	) return;
	//
	// 	const command = this.commands.commands.get( questionType );
	// 	if ( !command?.discord ) return;
	//
	// 	// Setup post data
	// 	const title = questionText.replace( `${questionType} `, '' );
	// 	const message = `${title}\n\r\n\rQuestion by **${user.displayName}** on Twitch.`;
	//
	// 	// Create Thread
	// 	const channelId = this.discord.channels[command.discord];
	//
	// 	this.discord.createPost( channelId, title, message )
	// 		.then( ( threadChannel ) =>
	// 		{
	// 			if ( threadChannel )
	// 			{
	// 				void this.chat.sendAction(
	// 					`Thread wurde zur Diskussion erstellt ▶️ ${threadChannel.url}`
	// 				);
	// 			}
	//
	// 			return true;
	// 		} );
	// }

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
			void this.chat.sendMessage( translation, msg );
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
		return { data: false };
	}
}
