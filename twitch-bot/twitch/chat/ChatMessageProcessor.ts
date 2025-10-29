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

import type { ChatMessage }  from '@twurple/chat';
import type { Twitch } from "@twitch/core/Twitch.ts";
import type { SimpleUser } from '@shared/types.ts';

export class ChatMessageProcessor
{
	constructor( private twitch: Twitch ) {}

	/** Process chat command
	 *
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message Object
	 */
	public async process( chatMessage: string, msg: ChatMessage )
	{
		if ( !chatMessage || !msg || !msg.userInfo )
			return;

		const user = await this.twitch.userConverter.convertToSimplerUser( msg.userInfo );
		if ( !user ) return;

		const chatMessageSanitized = sanitizeMessage( chatMessage );
		const chatMessagesWithEmotes = this.searchReplaceEmotes( chatMessageSanitized, msg );

		// Send to websocket connections
		this.twitch.ws.maybeSendWebsocketData( {
			type: 'message',
			user: user,
			text: chatMessagesWithEmotes
		} );

		// Reactions
		// for ( const [ _index, reaction ] of Object.entries( this.data.reactions ) )
		// {
		// 	if (
		// 		!reaction?.trigger ||
		// 		!reaction?.message ||
		// 		!chatMessage.match( reaction.trigger.toRegExp() )
		// 	)
		// 	{
		// 		continue;
		// 	}
		//
		// 	let message = getMessage( reaction.message );
		// 	message = message.replace( '[user]', user.displayName );
		// 	// Reply
		// 	// this.chat.sendMessage( message, msg );
		// 	void this.chat.sendAction( message );
		// }

		if ( !this.twitch.stream.isActive )
			return;

		// First Chat Event
		this.twitch.firstChatter.set( user );

		// Update message count
		if ( this.isValidMessageText( chatMessageSanitized, msg ) )
		{
			this.twitch.data.updateUserData( user, 'message_count' );
			this.twitch.data.updateStreamStats( user, 'message' );
			void this.translateIfNeeded( chatMessageSanitized, msg );
		}

		// Check for chat score
		this.checkChatScore( user );
	}

	/** Check if message should be handled */
	validate( channel: string, user: string, text: string, msg: ChatMessage )
	{
		if ( !channel || !user || !text || !msg )
			return false;

		// Not home channel
		if ( channel !== this.twitch.data.broadcasterName )
			return false;

		if ( this.twitch.data.isBot( user ) )
			return false;

		// Killswitch
		if ( this.twitch.killswitch.status && user.toLowerCase() !== this.twitch.data.broadcasterName )
			return false;

		return true;
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

		const emotes = this.twitch.data.emotes;
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

		const emotes = this.twitch.data.emotes;
		if ( !emotes ) return '';

		const parsedMessage = parseChatMessage( message, msg.emoteOffsets );
		const messageParts = [];

		for ( const [ _index, messagePart ] of parsedMessage.entries() )
		{
			if ( messagePart.type === 'text' )
			{
				messageParts.push( `<span>${ messagePart.text }</span>` );
				continue;
			}

			// Replace known Emotes
			if ( emotes.has( messagePart.name ) )
			{
				messageParts.push(
					`<img src='${
						emotes.get( messagePart.name )
					}' alt='${ messagePart.name }' class='emote emote-known' />`
				);
			}
			// Replace unknown Emotes
			else if ( messagePart.type === 'emote' )
			{
				messageParts.push(
					`<img src='https://static-cdn.jtvnw.net/emoticons/v2/${ messagePart.id }/static/dark/3.0' alt='${ messagePart.name }' class='emote emote-unknown' />`
				);
			}
		}

		let messageWithEmotes = messageParts.join( ' ' );

		// Replace all External Emotes
		messageWithEmotes = messageWithEmotes.split( ' ' ).map( ( word ) =>
			emotes.has( word ) ?
				`<img src='${ emotes.get( word ) }' alt='${ word }' class='emote emote-external' />` :
				word
		).join( ' ' );

		return messageWithEmotes;
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

			const translation = await Deepl.translate( message, this.twitch.stream.language );
			void this.twitch.chat.sendMessage( translation, msg );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Check for chat score
	 *
	 * @param {SimpleUser} user User Object to check for
	 */
	checkChatScore( user: SimpleUser )
	{
		if ( user?.name === this.twitch.data.broadcasterName )
			return;

		const chatscores = [
			100, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000
		];
		const count = this.twitch.data.getUserData( user.id! )?.message_count || 0;
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
