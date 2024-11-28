/**
 * FrankerFaceZ
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import type { FrankerFaceZEmoteSet, FrankerFaceZResponse, TwitchEmote } from '@propz/types.ts';
import { log } from '@propz/helpers.ts';

export class FrankerFaceZ
{
	/** Fetch FFZ Emotes */
	public static async getEmotes( userId: string ): Promise<TwitchEmote|undefined>
	{
		if ( !userId ) return;
		let globalEmotes: FrankerFaceZEmoteSet[];
		let channelEmotes: FrankerFaceZEmoteSet[];
		try
		{
			const [globalResponse, channelResponse] = await Promise.all([
				fetch('https://api.frankerfacez.com/v1/set/global'),
				fetch(`https://api.frankerfacez.com/v1/room/id/${ userId }`)
			]);

			const globalResponseJson = await globalResponse.json() as FrankerFaceZResponse;
			const channelResponseJson = await channelResponse.json() as FrankerFaceZResponse;

			globalEmotes = Object.values( globalResponseJson.sets );
			channelEmotes = Object.values( channelResponseJson.sets );

			if (
				!Array.isArray( globalEmotes ) ||
				!Array.isArray( channelEmotes )
			) return;
		}
		catch( error: unknown ) {
			log( error );
			return;
		}

		const emoteMap: TwitchEmote = {};
		for( const set of [ ...globalEmotes, ...channelEmotes ] )
		{
			for( const emote of set.emoticons )
			{
				emoteMap[ emote.name ] = emote.urls['4'];
			}
		}
	
		return emoteMap;
	}
}