/**
 * Event Processor
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { getMessage, getRandomNumber, log } from '@shared/helpers.ts';
import { BotData } from '@bot/BotData.ts';
import { StreamEvents } from '@modules/features/StreamEvents.ts';
import { StreamStats} from '@modules/features/StreamStats.ts';

import type { SimpleUser } from '@shared/types.ts';
import type { ChatUser } from '@twurple/chat';
import type { HelixUser } from '@twurple/api';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class EventProcessor
{
	constructor( private twitch: Twitch ) {}

	/** Process Twitch event.
	 *
	 * @param options
	 */
	public async process( options: {
		eventType: string;
		user: HelixUser | ChatUser | SimpleUser | string | null;
		eventCount?: number;
		eventText?: string;
		isTest?: boolean;
		sender?: string;
	} ): Promise<void>
	{
		let {
			eventType,
			user,
			eventCount = 0,
			eventText = '',
			isTest = false,
			sender = BotData.broadcasterName
		} = options;

		if ( !this.validate( eventType, user ) )
			return;

		// Get user data for username
		if ( typeof user === 'string' )
		{
			const userName = this.twitch.userConverter.getUsernameFromObject( user );
			user = await this.twitch.data.getUser( userName ) || '';
			// Twitch user not found = Probably kofi event
			if ( typeof user === 'string' )
			{
				if ( !eventType.startsWith( 'kofi' ) ) return;
				user = { name: userName, displayName: userName } as SimpleUser;
			}
		}
		user = await this.twitch.userConverter.convertToSimplerUser( user );
		if ( !user ) return;

		const event = this.twitch.streamEvents.get( eventType );

		this.twitch.ws.maybeSendWebsocketData( {
			type: eventType,
			user: user,
			text: getMessage( event.eventText, this.twitch.stream.language ) || eventText,
			count: eventCount,
			extra: event.extra?.[this.twitch.stream.language],
			obs: event.obs,
			hasSound: event.hasSound,
			hasVideo: event.hasVideo,
			showAvatar: event.showAvatar,
			saveEvent: event.saveEvent
		} );

		log( `${eventType} › ${user.displayName}` );

		// Exec command
		if ( event.isCommand )
			void this.twitch.commands.process( `!${eventType} ${eventText}`, null, user );

		// Save Event data persistent
		if ( !isTest && event.saveEvent && user.id )
		{
			StreamEvents.add( {
				type: eventType,
				user: user,
				timestamp: Math.floor( Date.now() / 1000 ),
				count: eventCount
			} );

			StreamStats.update( user, eventType, eventCount );
		}

		// Check for event messages and send to chat.
		let message = getMessage( event.message, this.twitch.stream.language ) || '';
		if ( !message )
			return;

		message = message.replaceAll( '[user]', user.displayName || user.name );
		message = message.replaceAll( '[count]', eventCount.toString() );
		message = message.replaceAll( '[sender]', sender );

		// Check for announcement
		if ( event.isAnnouncement )
			void this.twitch.chat.sendAnnouncement( message );
		else
			void this.twitch.chat.sendAction( message );
	}

	/** Check if event can be fired
	 *
	 * @param {string} eventType Event type name
	 * @param {HelixUser|SimpleUser|ChatUser|string|null} user
	 */
	public validate(
		eventType: string,
		user: HelixUser | SimpleUser | ChatUser | string | null
	): boolean
	{
		if ( !eventType || !user )
			return false;

		const userName = this.twitch.userConverter.getUsernameFromObject( user );
		if ( !userName ) return false;

		const event = this.twitch.streamEvents.get( eventType );
		if ( !event ) return false;

		// Killswitch
		if (
			this.twitch.killswitch.status &&
			userName !== BotData.broadcasterName
		) return false;

		// Prevent chatscore events to fire multiple times
		const [ lastEvent ] = this.twitch.streamEvents.getLast( this.twitch.stream.language ).slice(
			0,
			1
		);
		if (
			lastEvent &&
			eventType.startsWith( 'chatscore' ) &&
			eventType === lastEvent.type &&
			userName.toLowerCase() === (lastEvent.user?.name?.toLowerCase() || '')
		) return false;

		// Focus Mode
		if ( this.twitch.focus.timer && event.disableOnFocus )
			return false;

		return true;
	}

	/** Send test event
	 *
	 * @param {string} eventMessage Whole chat message to parse
	 */
	public sendTest( eventMessage: string ): void
	{
		if ( !eventMessage ) return;

		const splittedMessage = eventMessage.split( ' ' );
		const eventType = splittedMessage[ 0 ];
		let userName = BotData.botName;

		// ... or prioritize from command if given
		if ( splittedMessage[ 1 ] )
			userName = splittedMessage[ 1 ];

		// Text message for TTS
		let message = '';
		if ( splittedMessage[ 2 ] )
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
		let count = parseInt( splittedMessage[ 2 ] || '0' );
		if ( !count && eventTypesWithCount.includes( eventType ) )
			count = getRandomNumber( 50, 1 );

		void this.process( {
			eventType: eventType,
			user: userName,
			eventCount: count,
			eventText: message,
			isTest: true
		} );
	}
}
