/**
 * BetterTTV
 *
 * @author Wellington Estevo
 * @version 1.6.0
 */

import { log } from '@propz/helpers.ts';
import type { BTTVEmote, BTTVResponse, TwitchEmote } from '@propz/types.ts';

export class BetterTTV
{
	/** Fetch BTTV Emotes */
	public static async getEmotes( userId: string ): Promise<TwitchEmote | undefined>
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

		const emoteMap: TwitchEmote = {};
		for ( const emote of [ ...globalEmotes, ...channelEmotes.channelEmotes, ...channelEmotes.sharedEmotes ] )
		{
			emoteMap[emote.code] = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
		}

		return emoteMap;
	}
}
