/**
 * FrankerFaceZ
 *
 * @author Wellington Estevo
 * @version 2.2.2
 */

import { log } from '@shared/helpers.ts';
import type { FrankerFaceZEmoteSet } from '@shared/types.ts';

export class FrankerFaceZ
{
	/** Fetch FFZ Emotes */
	public static async getEmotes( userId: string ): Promise<Map<string, string> | undefined>
	{
		if ( !userId ) return;
		let globalEmotes: FrankerFaceZEmoteSet[];
		let channelEmotes: FrankerFaceZEmoteSet[];
		try
		{
			const [ responseGlobal, responseChannel ] = await Promise.all( [
				fetch( 'https://api.frankerfacez.com/v1/set/global' ),
				fetch( `https://api.frankerfacez.com/v1/room/id/${userId}` )
			] );

			const dataGlobal = await responseGlobal.json();
			if ( !responseGlobal.ok )
			{
				log(
					new Error(
						`${dataGlobal.error} (${dataGlobal.status}) › ${dataGlobal.message}`
					)
				);
				return;
			}

			const dataChannel = await responseChannel.json();
			if ( !responseChannel.ok )
			{
				log(
					new Error(
						`${dataChannel.error} (${dataChannel.status}) › ${dataChannel.message}`
					)
				);
				return;
			}

			globalEmotes = Object.values( dataGlobal.sets );
			channelEmotes = Object.values( dataChannel.sets );

			if (
				!Array.isArray( globalEmotes ) ||
				!Array.isArray( channelEmotes )
			) return;
		}
		catch ( error: unknown )
		{
			log( error );
			return;
		}

		const emoteMap: Map<string, string> = new Map();
		for ( const set of [ ...globalEmotes, ...channelEmotes ] )
		{
			for ( const emote of set.emoticons )
			{
				emoteMap.set( emote.name, emote.urls['4'] );
			}
		}

		return emoteMap;
	}
}
