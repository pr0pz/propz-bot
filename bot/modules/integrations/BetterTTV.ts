/**
 * BetterTTV
 *
 * @author Wellington Estevo
 * @version 2.3.1
 */

import { log } from '@shared/helpers.ts';
import type { BTTVEmote, BTTVResponse } from '@shared/types.ts';

export class BetterTTV
{
	/** Fetch BTTV Emotes */
	public static async getEmotes( userId: string ): Promise<Map<string, string> | undefined>
	{
		if ( !userId ) return;
		let globalEmotes: BTTVEmote[];
		let channelEmotes: BTTVResponse;
		try
		{
			const [ responseGlobal, responseChannel ] = await Promise.all( [
				fetch( 'https://api.betterttv.net/3/cached/emotes/global' ),
				fetch( `https://api.betterttv.net/3/cached/users/twitch/${userId}` )
			] );

			const dataGlobal = await responseGlobal.json();
			if ( !responseGlobal.ok )
			{
				log(
					new Error(
						`${dataGlobal.error} (${dataGlobal.statusCode}) › ${dataGlobal.message}`
					)
				);
				return;
			}

			const dataChannel = await responseChannel.json();
			if ( !responseChannel.ok )
			{
				log(
					new Error(
						`${dataChannel.error} (${dataChannel.statusCode}) › ${dataChannel.message}`
					)
				);
				return;
			}

			globalEmotes = dataGlobal;
			channelEmotes = dataChannel;
		}
		catch ( error: unknown )
		{
			log( error );
			return;
		}

		const emoteMap: Map<string, string> = new Map();
		for ( const emote of [
			...globalEmotes,
			...channelEmotes.channelEmotes,
			...channelEmotes.sharedEmotes
		] )
		{
			emoteMap.set( emote.code, `https://cdn.betterttv.net/emote/${emote.id}/3x` );
		}

		return emoteMap;
	}
}
