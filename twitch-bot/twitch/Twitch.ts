/**
 * Main Twitch Controler
 * 
 * @author Wellington Estevo
 * @version 1.2.9
 */

import '@propz/prototypes.ts';
import { TwitchUtils } from './TwitchUtils.ts';
import { getMessage, sanitizeMessage } from '@propz/helpers.ts';
import { OpenWeather } from '../external/OpenWeather.ts';

import type { Discord } from '../discord/Discord.ts';
import type { HelixUser } from '@twurple/api';
import type { ChatMessage, ChatUser } from '@twurple/chat';
import type { BotData } from '../bot/BotData.ts';
import type { BotWebsocket } from '../bot/BotWebsocket.ts';
import type { ApiRequest, ApiResponse, SimpleUser, TwitchCommandOptions } from '@propz/types.ts';

export class Twitch extends TwitchUtils
{
	constructor( data: BotData, discord: Discord, ws: BotWebsocket )
	{
		if ( !discord ) throw new Error( 'Discord is empty' );
		if ( !data ) throw new Error( 'Data is empty' );
		if ( !ws ) throw new Error( 'BotWebsocket is empty' );
		
		super( data, discord, ws );
	}

	/** Init Main Twitch Controller */
	async init()
	{
		this.data.init();
		this.chat.connect();
		this.events.startListener();

		await this.setStream();

		Deno.cron( 'Bot minutely', '* * * * *', () =>
		{
			if ( !this.isStreamActive ) return;
			this.handleTimers();
			this.data.saveUsersAndEventsData();
		});

		Deno.cron( 'Bot daily', '0 4 * * *', () =>
		{
			this.data.init();
			this.data.resetCredits();
		});
	}

	/** Process chat command
	 * 
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message object
	 */
	override async processChatCommand(chatMessage: string, user: ChatUser|SimpleUser)
	{
		if (!this.fireCommand(chatMessage, user)) return;

		const sender = await this.convertToSimplerUser( user );
		const commandName = this.commands.getCommandNameFromMessage( chatMessage );
		const command = this.commands.commands.get( commandName )!;

		this.ws.maybeSendWebsocketData({
			type: 'command',
			user: sender,
			text: commandName,
			obs: command.obs,
			hasSound: command.hasSound,
			hasVideo: command.hasVideo
		});
		
		let message = getMessage( command.message, this.streamLanguage );

		if ( command.handler )
		{
			const chatMessageSplitted = chatMessage.trim().split( ' ' );
			const options: TwitchCommandOptions = {
				sender: sender,
				param: chatMessageSplitted[1] || '',
				message: chatMessage.replace( '!' + commandName, '' ).trim(),
				commandMessage: message
			};

			message = await command.handler( options ) || '';
		}

		if ( message )
			this.chat.sendAction( message );
	}

	/** Process chat command
	 * 
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message Object
	 */
	override async processChatMessage( chatMessage: string, msg: ChatMessage )
	{
		if ( !chatMessage || !msg ) return;

		const user = await this.convertToSimplerUser( msg.userInfo );
		const chatMessageSanitized = sanitizeMessage( chatMessage );
		const chatMessagesWithEmotes = this.searchReplaceEmotes( chatMessageSanitized, msg );

		// Send to websocket connections
		this.ws.maybeSendWebsocketData( {
			type: 'message',
			user: user,
			text: chatMessagesWithEmotes
		});

		// Reactions
		for( const [_index, reaction] of Object.entries( this.data.reactions ) )
		{
			if (
				!reaction?.trigger ||
				!reaction?.message ||
				!chatMessage.match( reaction.trigger.toRegExp() )
			) continue;

			let message = getMessage( reaction.message );
			message = message.replace( '[user]', user.displayName );
			// Reply
			//this.chat.sendMessage( message, msg );
			this.chat.sendAction( message );
		}
		
		// First Chat Event
		this.checkFirstChatterEvent( user );

		if ( !this.isStreamActive ) return;

		// Update message count
		if ( this.isValidMessageText( chatMessageSanitized, msg ) )
		{
			this.data.updateUserData( user, 'messages', 1 );
			this.data.updateCredits( user, 'message', 1 );
		}

		// Check for chat score
		this.checkChatScore( user );
	}

	/** Process Twitch event.
	 * 
	 * @param {String} eventType Type of event
	 * @param {String} userName User name
	 * @param {int|float} eventCount Event count
	 * @param {String} eventText Type with event (TTS)
	 * @param {boolean} isTest If is test event
	 */
	override async processEvent( options: {
		eventType: string,
		user: HelixUser|ChatUser|SimpleUser|string,
		eventCount?: number,
		eventText?: string,
		isTest?: boolean
	})
	{
		let { eventType, user, eventCount = 0, eventText = '', isTest = false } = options;
		
		if ( !this.fireEvent( eventType, user ) ) return;

		// Get user data for username
		if ( typeof user === 'string' )
		{
			const userName = this.getUsernameFromObject( user );
			user = await this.data.getUser( userName ) || '';
			// Twitch user not found = Probably kofi event
			if ( typeof user === 'string' )
				user = { name: userName, displayName: userName } as SimpleUser;
		}
		user = await this.convertToSimplerUser( user );

		const event = this.data.getEvent( eventType );

		this.ws.maybeSendWebsocketData({
			type: eventType,
			user: user,
			text: getMessage( event.eventText, this.streamLanguage ) || eventText,
			count: eventCount,
			extra: event.extra?.[ this.streamLanguage ],
			obs: event.obs,
			hasSound: event.hasSound,
			hasVideo: event.hasVideo,
			saveEvent: event.saveEvent
		});

		// Save Event data persistent
		if ( !isTest && event.saveEvent )
		{
			this.data.addEvent({
				eventUsername: user.displayName,
				eventType: eventType,
				eventTimestamp: Math.floor( Date.now() / 1000 ),
				eventCount: eventCount
			});

			this.data.updateCredits( user, eventType, eventCount );
		}

		// Check for event messages and send to chat.
		let message = getMessage( event.message, this.streamLanguage ) || '';
		if ( !message ) return;

		message = message.replaceAll( '[user]', user.displayName || user.name );
		message = message.replaceAll( '[count]', eventCount.toString() );

		// Check for announcement
		if ( event.isAnnouncement )
			this.chat.sendAnnouncement( message );
		else
			this.chat.sendAction( message );
	}

	/** Handle API calls
	 * 
	 * @param {Object} data Request data
	 */
	override async processApiCall( apiRequest: ApiRequest ): Promise<ApiResponse>
	{
		const response: ApiResponse = { 'data': false }
		if ( !apiRequest?.request ) return response;

		let user: HelixUser|SimpleUser|null = await this.data.getUser();
		if ( !user ) return response;

		user = await this.convertToSimplerUser( user );

		if ( apiRequest.request.startsWith( 'command-') )
		{
			const commandName = apiRequest.request.replace( 'command-', '' );
			this.processChatCommand( commandName, user );
			response.data = true;
			return response;
		}

		switch( apiRequest.request )
		{
			case 'chatCommands':
				response.data = Object.fromEntries( this.commands.commands );
				break;
			
			case 'getCredits':
				response.data = this.data.credits;
				break;

			case 'getEmotes':
				response.data = this.data.emotes;
				break;

			case 'getSchedule':
				response.data = await this.data.getSchedule() || false;
				break;

			case 'getScheduleIcal':
				response.data = await this.data.getScheduleIcal();
				break;

			case 'getStream':
				response.data = this.getStreamApi() || false;
				break;

			case 'isStreamActive':
				response.data = this.isStreamActive;
				break;

			case 'getEvents':
				response.data = this.data.getLastEventsData( this.streamLanguage );
				break;

			case 'getWeather':
				if ( !apiRequest.data?.cityName || !apiRequest.data?.countryCode )
					return response;

				response.data = await OpenWeather.handleWeatherRequest( apiRequest.data.cityName, apiRequest.data.countryCode );
				break;
		}

		return response;
	}
}