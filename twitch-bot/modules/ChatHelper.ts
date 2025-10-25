/**
 * Chat
 *
 * @author Wellington Estevo
 * @version 1.10.6
 */

import cld from 'cld';
import { Deepl } from '@modules/Deepl.ts';
import { parseChatMessage } from '@twurple/chat';
import { getMessage, log, sanitizeMessage } from '@propz/helpers.ts';

import type { SimpleUser, TwitchCommandOptions } from "@propz/types.ts";
import type { ChatMessage } from "@twurple/chat";
import type { TwitchUtils } from "../twitch/TwitchUtils.ts";

export class ChatHelper
{
	private validMessageThreshold = 5;
	public firstChatter = '';

	constructor( private twitch: TwitchUtils ) {}

	/** Process chat command
	 *
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message Object
	 */
	public async processChatMessage( chatMessage: string, msg: ChatMessage )
	{
		if ( !chatMessage || !msg || !msg.userInfo )
			return;

		const user = await this.twitch.convertToSimplerUser( msg.userInfo );
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

		if ( !this.twitch.isStreamActive )
			return;

		// First Chat Event
		this.setStreamFirstChatter( user );

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

	/** Process chat command
	 *
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message object
	 * @param {SimpleUser|null} user
	 */
	public async processChatCommand( chatMessage: string, msg: ChatMessage | null, user: SimpleUser | null = null )
	{
		const userName = msg?.userInfo?.userName ?? user?.name ?? '';
		if ( !this.fireCommand( chatMessage, userName ) ) return;

		const sender = await this.twitch.convertToSimplerUser( msg?.userInfo ?? user ?? null );
		if ( !sender ) return;

		const commandName = this.twitch.commands.getCommandNameFromMessage( chatMessage );
		const command = this.twitch.commands.commands.get( commandName )!;

		this.twitch.ws.maybeSendWebsocketData( {
			type: 'command',
			user: sender,
			text: commandName,
			obs: command.obs,
			hasSound: command.hasSound,
			hasVideo: command.hasVideo
		} );

		let message = getMessage( command.message, this.twitch.streamLanguage );

		if ( command.handler )
		{
			const chatMessageSplitted = chatMessage.trim().split( ' ' );
			const options: TwitchCommandOptions = {
				sender: sender,
				param: chatMessageSplitted[1] || '',
				message: chatMessage.replaceAll( /^(?:@\w+\s)?!\w+/gi, '' ).trim(),
				returnMessage: message,
				messageObject: msg,
				stream: this.twitch.stream
			};

			message = await command.handler( options ) || '';
		}

		if ( message )
			void this.twitch.chat.sendAction( message );
	}

	/** Check if commands can be executed */
	public fireCommand( chatMessage: string, userName: string )
	{
		if ( !chatMessage ) return false;

		const commandName = this.twitch.commands.getCommandNameFromMessage( chatMessage );
		const command = this.twitch.commands.commands.get( commandName );

		// No data for this command
		if ( !command ) return false;

		// Focus Mode
		if ( this.twitch.focus.timer && command.disableOnFocus )
			return false;

		// Disable if Stream is offline
		if ( !this.twitch.isStreamActive && command.disableIfOffline )
			return false;

		// Check for mod properties
		if (
			command.onlyMods &&
			!this.twitch.data.mods.includes( userName ) &&
			userName !== this.twitch.data.userName
		) return false;

		if ( this.twitch.commands.isCommandInCooldown( commandName ) )
			return false;

		return true;
	}

	/** Check if message should be handled */
	fireMessage( channel: string, user: string, text: string, msg: ChatMessage )
	{
		if ( !channel || !user || !text || !msg )
			return false;

		// Not home channel
		if ( channel !== this.twitch.data.userName )
			return false;

		if ( this.twitch.data.isBot( user ) )
			return false;

		// Killswitch
		if ( this.twitch.killswitch.status && user.toLowerCase() !== this.data.userName )
			return false;

		return true;
	}

	/** Check and set firstchatter of each stream
	 *
	 * @param {SimpleUser} user user data
	 */
	setStreamFirstChatter( user: SimpleUser )
	{
		if (
			this.firstChatter ||
			user?.name === this.twitch.data.userName
		) return;

		this.firstChatter = user.displayName;
		this.twitch.data.updateUserData( user, 'first_count' );
		this.twitch.data.updateStreamStats( user, 'first_chatter' );

		void this.twitch.processEvent( {
			eventType: 'firstchatter',
			user: user.displayName
		} );
	}

	/** Check for chat score
	 *
	 * @param {SimpleUser} user User Object to check for
	 */
	checkChatScore( user: SimpleUser )
	{
		if ( user?.name === this.twitch.data.userName )
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
		const count = this.twitch.data.getUserData( user.id! )?.message_count || 0;
		if ( count && chatscores.includes( count ) )
		{
			void this.twitch.processEvent( {
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

			const translation = await Deepl.translate( message, this.twitch.streamLanguage );
			void this.twitch.chat.sendMessage( translation, msg );
		}
		catch ( error: unknown ) { log( error ) }
	}
}
