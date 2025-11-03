/**
 * Chat Message Processor
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import cld from 'cld';
import { Deepl} from "@modules/integrations/Deepl.ts";
import { log, sanitizeMessage } from '@shared/helpers.ts';
import { parseChatMessage } from '@twurple/chat';
import { StreamStats } from '@services/StreamStats.ts';
import { UserData } from '@services/UserData.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { ChatMessage }  from '@twurple/chat';
import type { Twitch } from '@twitch/core/Twitch.ts';
import type { SimpleUser } from '@shared/types.ts';

export class MessageProcessor
{
	constructor( private twitch: Twitch ) {}

	/** Process chat command
	 *
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message Object
	 */
	public async process( chatMessage: string, msg: ChatMessage ): Promise<void>
	{
		if ( !chatMessage || !msg || !msg.userInfo )
			return;

		const user = await this.twitch.userHelper.convertToSimplerUser( msg.userInfo );
		if ( !user ) return;

		const chatMessageSanitized = sanitizeMessage( chatMessage );
		const chatMessagesWithEmotes = this.twitch.emotes.searchReplace( chatMessageSanitized, msg );

		// Send to websocket connections
		this.twitch.ws.maybeSendWebsocketData( {
			type: 'message',
			user: user,
			text: chatMessagesWithEmotes
		} );

		if ( !this.twitch.stream.isActive ) return;

		// First Chat Event
		this.twitch.firstChatter.set( user );

		// Update message count
		if ( this.isValidMessageText( chatMessageSanitized, msg ) )
		{
			UserData.update( user, 'message_count' );
			StreamStats.update( user, 'message' );
			void this.translateIfNeeded( chatMessageSanitized, msg );
		}

		// Check for chat score
		this.checkChatScore( user );
	}

	/** Check if message should be handled */
	public validate(
		channel: string,
		user: string,
		text: string,
		msg: ChatMessage
	): boolean
	{
		if ( !channel || !user || !text || !msg )
			return false;

		// Not home channel
		if ( channel !== UserHelper.broadcasterName )
			return false;

		// Killswitch
		if ( this.twitch.killswitch.status && user.toLowerCase() !==  UserHelper.broadcasterName )
			return false;

		return true;
	}

	/** Check if is valid text message for stats.
	 *
	 * @param {string} message Message to search and replace
	 * @param {ChatMessage} msg Message object
	 */
	public isValidMessageText( message: string, msg: ChatMessage ): boolean
	{
		if ( !message || !msg )
			return false;

		const emotes = this.twitch.emotes.get();
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

		const validMessageThreshold = 5;

		if (
			!messageParts.length ||
			messageParts.join( ' ' ).length < validMessageThreshold
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
			messageWithEmotes.join( ' ' ).length < validMessageThreshold
		) return false;

		return true;
	}

	/** Auto translate if needed
	 *
	 * @param {string} message
	 * @param {ChatMessage} msg
	 */
	private async translateIfNeeded( message: string, msg: ChatMessage ): Promise<void>
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

			const translation = await Deepl.translate( message, this.twitch.stream.language );
			void this.twitch.chat.sendMessage( translation, msg );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Check for chat score
	 *
	 * @param {SimpleUser} user User Object to check for
	 */
	private checkChatScore( user: SimpleUser ): void
	{
		if ( user?.name ===  UserHelper.broadcasterName )
			return;

		const chatscores = [
			100, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000
		];
		const count = UserData.get( user.id! )?.message_count || 0;
		if ( count && chatscores.includes( count ) )
		{
			void this.twitch.events.eventProcessor.process( {
				eventType: 'chatscore-' + count,
				user: user,
				eventCount: count
			} );
		}
	}
}
