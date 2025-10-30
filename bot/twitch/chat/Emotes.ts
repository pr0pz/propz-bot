/**
 * Emotes
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log, objectToMap } from '@shared/helpers.ts';
import { BotData } from '@services/BotData.ts';
import { BetterTTV } from '@modules/integrations/BetterTTV.ts';
import { FrankerFaceZ } from '@modules/integrations/FrankerFaceZ.ts';
import { parseChatMessage } from '@twurple/chat';
import { SevenTV } from '@modules/integrations/SevenTV.ts';

import type { ApiClient } from '@twurple/api';
import type { ChatMessage } from '@twurple/chat';
import type { TwitchEmote } from '@shared/types.ts';

export class Emotes
{
	public emotes: Map<string, string> = new Map();

	constructor( private twitchApi: ApiClient ) {}

	public get() { return this.emotes; }

	/** Get all emotes: Twitch, 7TV, BTTV, FFZ */
	public async init(): Promise<void>
	{
		const [ emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV ] = await Promise.all( [
			this.getFromTwitch(),
			FrankerFaceZ.getEmotes( BotData.broadcasterId ),
			SevenTV.getEmotes(),
			BetterTTV.getEmotes( BotData.broadcasterId )
		] );
		const emotes = Object.assign(
			{},
			emotesTwitch,
			emotesFFZ,
			emotes7TV,
			emotesBTTV
		);

		this.emotes = objectToMap( emotes );
	}

	/** Fetch twitch Emotes */
	private async getFromTwitch(): Promise<TwitchEmote>
	{
		const emoteMap: TwitchEmote = {};
		try
		{
			const [ globalEmotes, channelEmotes ] = await Promise.all( [
				this.twitchApi.chat.getGlobalEmotes(),
				this.twitchApi.chat.getChannelEmotes( BotData.broadcasterId )
			] );

			globalEmotes.concat( channelEmotes ).forEach( ( emote ) =>
			{
				let url = emote.getAnimatedImageUrl( '3.0' );
				if ( !url ) url = emote.getFormattedImageUrl( '3.0' );
				emoteMap[emote.name] = url;
			} );

			return emoteMap;
		}
		catch ( error: unknown ) { log( error ) }
		return emoteMap;
	}

	/** Search and replace emotes with images tags on chat message.
	 *
	 * @param {string} message Message to search and replace
	 * @param {ChatMessage} msg message object
	 * @returns {string} Modlist with all nicknames
	 */
	public searchReplace( message: string, msg: ChatMessage ): string
	{
		if ( !message || !msg )
			return '';

		const emotes = this.emotes;
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
}
