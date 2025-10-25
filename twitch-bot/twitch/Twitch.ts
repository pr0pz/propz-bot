/**
 * Main Twitch Controler
 *
 * @author Wellington Estevo
 * @version 1.10.6
 */

import '@propz/prototypes.ts';
import { getMessage, log, mapToObject } from '@propz/helpers.ts';
import { OpenWeather } from '../modules/OpenWeather.ts';
import { TwitchUtils } from './TwitchUtils.ts';

import type { ApiRequest, ApiResponse, SimpleUser, TwitchCommandOptions } from '@propz/types.ts';
import type { HelixUser } from '@twurple/api';
import type { ChatUser } from '@twurple/chat';
import type { BotData } from '../bot/BotData.ts';
import type { BotWebsocket } from '../bot/BotWebsocket.ts';
import type { Discord } from '../discord/Discord.ts';

export class Twitch extends TwitchUtils
{
	constructor( data: BotData, discord: Discord, ws: BotWebsocket )
	{
		if ( !discord )
			throw new Error( 'Discord is empty' );
		if ( !data )
			throw new Error( 'Data is empty' );
		if ( !ws )
			throw new Error( 'BotWebsocket is empty' );

		super( data, discord, ws );
	}

	/** Init Main Twitch Controller */
	async init()
	{
		void this.data.init();
		this.chat.connect();
		this.events.startListener();
		this.firstChatter = this.data.firstChatter;

		await this.setStream();

		log( 'Bot init ✅' );

		void Deno.cron( 'Bot minutely', '* * * * *', () =>
		{
			if ( !this.isStreamActive ) return;
			this.handleTimers();
		} );

		void Deno.cron( 'Bot daily', '0 4 * * *', () =>
		{
			this.firstChatter = '';
			this.data.db.execute( `DELETE FROM stream_stats;` );
			this.data.db.cleanupDatabase();
			this.data.db.initDatabase();
			this.data.init();
			this.reloadConfig();
		} );

		log( 'Cronjobs init ✅' );
	}

	/** Process Twitch event.
	 *
	 * @param options
	 */
	override async processEvent( options: {
		eventType: string;
		user: HelixUser | ChatUser | SimpleUser | string | null;
		eventCount?: number;
		eventText?: string;
		isTest?: boolean;
		sender?: string;
	} )
	{
		let { eventType, user, eventCount = 0, eventText = '', isTest = false, sender = this.data.userDisplayName } =
			options;

		if ( !this.fireEvent( eventType, user ) )
			return;

		// Get user data for username
		if ( typeof user === 'string' )
		{
			const userName = this.getUsernameFromObject( user );
			user = await this.data.getUser( userName ) || '';
			// Twitch user not found = Probably kofi event
			if ( typeof user === 'string' )
			{
				if ( !eventType.startsWith( 'kofi' ) )
					return;
				user = { name: userName, displayName: userName } as SimpleUser;
			}
		}
		user = await this.convertToSimplerUser( user );
		if ( !user ) return;

		const event = this.data.getEvent( eventType );

		this.ws.maybeSendWebsocketData( {
			type: eventType,
			user: user,
			text: getMessage( event.eventText, this.streamLanguage ) || eventText,
			count: eventCount,
			extra: event.extra?.[this.streamLanguage],
			obs: event.obs,
			hasSound: event.hasSound,
			hasVideo: event.hasVideo,
			showAvatar: event.showAvatar,
			saveEvent: event.saveEvent
		} );

		log( `${eventType} › ${user.displayName}` );

		// Exec command
		if ( event.isCommand )
			void this.chat.chatHelper.processChatCommand( `!${eventType} ${eventText}`, null, user );

		// Save Event data persistent
		if ( !isTest && event.saveEvent && user.id )
		{
			this.data.addEvent( {
				type: eventType,
				user: user,
				timestamp: Math.floor( Date.now() / 1000 ),
				count: eventCount
			} );

			this.data.updateStreamStats( user, eventType, eventCount );
		}

		// Check for event messages and send to chat.
		let message = getMessage( event.message, this.streamLanguage ) || '';
		if ( !message )
			return;

		message = message.replaceAll( '[user]', user.displayName || user.name );
		message = message.replaceAll( '[count]', eventCount.toString() );
		message = message.replaceAll( '[sender]', sender );

		// Check for announcement
		if ( event.isAnnouncement )
			void this.chat.sendAnnouncement( message );
		else
			void this.chat.sendAction( message );
	}

	/** Handle API calls
	 *
	 * @param {ApiRequest} apiRequest
	 */
	override async processApiCall( apiRequest: ApiRequest ): Promise<ApiResponse>
	{
		const response: ApiResponse = { data: false };
		if ( !apiRequest?.request ) return response;

		let user: HelixUser | SimpleUser | null = await this.data.getUser();
		if ( !user ) return response;

		user = await this.convertToSimplerUser( user );

		if ( apiRequest.request.startsWith( 'command-' ) )
		{
			const commandName = apiRequest.request.replace( 'command-', '!' );
			void this.processChatCommand( commandName, null, user );
			response.data = true;
			return response;
		}

		switch ( apiRequest.request )
		{
			case 'chatCommands':
				response.data = Object.fromEntries( this.commands.commands );
				break;

			case 'getStreamStats':
				response.data = this.data.streamStats;
				break;

			case 'getEmotes':
				response.data = this.data.emotes;
				break;

			case 'getSchedule':
				response.data = await this.data.getSchedule() || false;
				break;

			case 'getStream':
				response.data = this.getStreamApi() || false;
				break;

			case 'isStreamActive':
				response.data = this.isStreamActive;
				break;

			case 'getEvents':
				response.data = mapToObject( this.data.events );
				break;

			case 'getLastEvents':
				response.data = this.data.getLastEventsData( this.streamLanguage );
				break;

			case 'getWeather':
				if (
					!apiRequest.data?.cityName &&
					(
						!apiRequest.data?.lat &&
						!apiRequest.data?.lon
					)
				) return response;

				response.data = await OpenWeather.handleWeatherRequest(
					apiRequest.data.cityName || '',
					apiRequest.data.countryCode || '',
					apiRequest.data.lat || '',
					apiRequest.data.lon || ''
				) ?? false;
				break;
		}

		return response;
	}
}
