import { getMessage, log } from '@shared/helpers.ts';
import { StreamEvents } from '@services/StreamEvents.ts';
import { StreamStats} from '@services/StreamStats.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';
import { randomIntegerBetween } from '@std/random';

import type { SimpleUser, TwitchEvent } from '@shared/types.ts';
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
		eventDate?: Date;
		isTest?: boolean;
		sender?: string;
	} ): Promise<void>
	{
		let {
			eventType,
			user,
			eventCount = 0,
			eventText = '',
			eventDate = new Date(),
			isTest = false,
			sender = UserHelper.broadcasterName
		} = options;

		if ( !this.validate( eventType, user ) ) return;

		// Get user data
		user = await this.getEventUser( user, eventType );
		if ( !user ) return;

		// Get Event
		const event = this.twitch.streamEvents.get( eventType );
		event.date = eventDate;

		// Send to WS
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

		// Maybe run command
		if ( event.isCommand )
			void this.twitch.commands.process( `!${eventType} ${eventText}`, null, user );

		// Save Event data persistent
		if ( !isTest && event.saveEvent && user.id )
			this.saveEvent( user, eventType, eventCount );

		// Send Event Message
		this.sendEventMessage( event, user, eventCount, sender );

		log( `${eventType} › ${user.displayName}` );
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

		const userName = this.twitch.userHelper.getUsernameFromObject( user );
		if ( !userName ) return false;

		const event = this.twitch.streamEvents.get( eventType );
		if ( !event ) return false;

		// Killswitch
		if (
			this.twitch.killswitch.status &&
			userName !== UserHelper.broadcasterName
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
			userName.toLowerCase() === (lastEvent.name?.toLowerCase() || '')
		) return false;

		// Focus Mode
		if ( this.twitch.focus.timer && event.disableOnFocus )
			return false;

		return true;
	}

	/**
	 * Get User for event processing
	 *
	 * @param {HelixUser | ChatUser | SimpleUser| string | null} user
	 * @param {string} eventType
	 * @returns {Promise<SimpleUser | null>}
	 * @private
	 */
	private async getEventUser( user: HelixUser | ChatUser | SimpleUser | string | null, eventType: string ): Promise<SimpleUser | null>
	{
		if ( typeof user === 'string' )
		{
			const userName = this.twitch.userHelper.getUsernameFromObject( user );
			user = await this.twitch.userHelper.getUser( userName ) || '';

			// Twitch user not found = Probably kofi event
			if ( typeof user === 'string' )
			{
				if ( !eventType.startsWith( 'kofi' ) ) return null;
				return { name: userName, displayName: userName } as SimpleUser;
			}
		}
		return await this.twitch.userHelper.convertToSimplerUser( user );
	}

	/**
	 * Maybe save event persistent
	 *
	 * @param {SimpleUser} user
	 * @param {string} eventType
	 * @param {number} eventCount
	 * @private
	 */
	private saveEvent( user: SimpleUser, eventType: string, eventCount: number ): void
	{
		StreamEvents.add( {
			type: eventType,
			user: user,
			timestamp: Math.floor( Date.now() / 1000 ),
			count: eventCount
		} );

		StreamStats.update( user, eventType, eventCount );
	}

	/**
	 * Maybe send event message to chat
	 *
	 * @param {TwitchEvent} event
	 * @param {SimpleUser} user
	 * @param {number} eventCount
	 * @param {string} sender
	 * @private
	 */
	private sendEventMessage( event: TwitchEvent, user: SimpleUser, eventCount: number, sender: string ): void
	{
		// Check for event messages and send to chat.
		let message = getMessage( event.message, this.twitch.stream.language ) || '';
		if ( !message ) return;

		message = message.replaceAll( '[user]', user.displayName || user.name );
		message = message.replaceAll( '[count]', eventCount.toString() );
		message = message.replaceAll( '[sender]', sender );

		// Check for announcement
		if ( event.isAnnouncement )
			void this.twitch.chat.sendAnnouncement( message );
		else
			void this.twitch.chat.sendAction( message );
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
		let userName = UserHelper.botName;

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
			count = randomIntegerBetween( 1, 50 );

		void this.process( {
			eventType: eventType,
			user: userName,
			eventCount: count,
			eventText: message,
			isTest: true
		} );
	}
}
