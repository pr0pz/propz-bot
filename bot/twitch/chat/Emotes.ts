import { log } from '@shared/helpers.ts';
import { BetterTTV } from '@modules/integrations/BetterTTV.ts';
import { FrankerFaceZ } from '@modules/integrations/FrankerFaceZ.ts';
import { buildEmoteImageUrl, parseChatMessage } from '@twurple/chat';
import { SevenTV } from '@modules/integrations/SevenTV.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { ApiClient } from '@twurple/api';
import type { ChatMessage } from '@twurple/chat';

export class Emotes
{
	public emotes: Map<string, string> = new Map();

	constructor( private twitchApi: ApiClient ) {}

	public get() { return this.emotes; }

	/** Get all emotes: Twitch, 7TV, BTTV, FFZ */
	public async init(): Promise<void>
	{
		const [ emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV ] = await Promise.all( [
			this.getAllEmotes(),
			FrankerFaceZ.getEmotes( UserHelper.broadcasterId ),
			SevenTV.getEmotes(),
			BetterTTV.getEmotes( UserHelper.broadcasterId )
		] );
		this.emotes = new Map([ ...emotesTwitch, ...emotesFFZ, ...emotes7TV, ...emotesBTTV ]);
	}

	private async getAllEmotes(): Promise<Map<string, string>>
	{
		let emoteMap: Map<string, string> = new Map();
		try
		{
			const [ globalEmotes, channelEmotes ] = await Promise.all( [
				this.getGlobalEmotes(),
				this.getChannelEmotes()
			] );
			emoteMap = new Map( [ ...globalEmotes, ...channelEmotes ] );
		}
		catch ( error: unknown ) { log( error ) }
		return emoteMap;
	}

	public async getChannelEmotes(): Promise<Map<string, string>>
	{
		const emoteMap: Map<string, string> = new Map();
		try
		{
			const channelEmotes = await Promise.resolve( this.twitchApi.chat.getChannelEmotes( UserHelper.broadcasterId ) );
			channelEmotes.forEach( ( emote ) =>
			{
				let url = emote.getAnimatedImageUrl( '3.0' );
				if ( !url ) url = emote.getFormattedImageUrl( '3.0' );
				emoteMap.set( emote.name, url );
			} );
		}
		catch ( error: unknown ) { log( error ) }
		return emoteMap;
	}

	private async getGlobalEmotes(): Promise<Map<string, string>>
	{
		const emoteMap: Map<string, string> = new Map();
		try
		{
			const globalEmotes = await Promise.resolve( this.twitchApi.chat.getGlobalEmotes() );
			globalEmotes.forEach( ( emote ) =>
			{
				let url = emote.getAnimatedImageUrl( '3.0' );
				if ( !url ) url = emote.getFormattedImageUrl( '3.0' );
				emoteMap.set( emote.name, url );
			} );
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
				// Replace all External Emotes
				const textPart = messagePart.text.split( ' ' ).map( ( word ) =>
					emotes.has( word ) ?
						`<img src="${ emotes.get( word ) }" class="emote emote-external" />` :
						( word === '' ? '' : `<span class="text">${ word }</span>` )
				).join( ' ' );

				messageParts.push( textPart );
			}
			else if ( messagePart.type === 'emote' )
			{
				const emotePart = buildEmoteImageUrl( messagePart.id, {
					backgroundType: 'dark',
					size: '3.0'
				} );
				messageParts.push( `<img src="${ emotePart }" class="emote emote-unknown" />` );
			}
		}

		return messageParts.join( ' ' );
	}
}
