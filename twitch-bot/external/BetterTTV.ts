/**
 * BetterTTV
 * 
 * @author Wellington Estevo
 * @version 1.0.3
 */

import { log } from '@propz/helpers.ts';
import type { BTTVEmote, BTTVResponse, TwitchEmote } from '@propz/types.ts';

export class BetterTTV
{
	/** Fetch BTTV Emotes */
	public static async getEmotes( userId: string ): Promise<TwitchEmote|undefined>
	{
		if ( !userId ) return;
		let globalEmotes: BTTVEmote[];
		let channelEmotes: BTTVResponse;
		try
		{
			const [globalResponse, channelResponse] = await Promise.all([
				fetch( 'https://api.betterttv.net/3/cached/emotes/global' ),
				fetch( `https://api.betterttv.net/3/cached/users/twitch/${ userId }` )
			]);

			globalEmotes = await globalResponse.json();
			channelEmotes = await channelResponse.json();
			if ( !globalEmotes || !channelEmotes ) return;
		}
		catch( error: unknown )
		{
			log( error );
			return;
		}

		const emoteMap: TwitchEmote = {};
		for( const emote of [ ...globalEmotes, ...channelEmotes.channelEmotes, ...channelEmotes.sharedEmotes ] )
		{
			emoteMap[ emote.code ] = `https://cdn.betterttv.net/emote/${ emote.id }/3x`;
		}
	
		return emoteMap;
	}
}