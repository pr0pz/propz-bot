/**
 * SevenTV
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import type { SevenTVEmoteSet, TwitchEmote } from '@shared/types.ts';

export class SevenTV
{
	/** Fetch 7TV Emotes
	 *
	 * query GetEmoteSet($id: ObjectID!) { emoteSet(id: $id) { emotes { data { name host { url } } } } }
	 *
	 * global: 01GD17VE2R000E0RPNH2V9Z16G
	 * propz: 01HZKY8CFR0002X9JFJVAG7PKX
	 *
	 * @returns {Promise<TwitchEmote|undefined>}
	 */
	public static async getEmotes(): Promise<TwitchEmote | undefined>
	{
		let seventv: SevenTVEmoteSet[];
		try
		{
			const response = await fetch( 'https://7tv.io/v3/gql', {
				method: 'post',
				body: JSON.stringify( [
					{
						operationName: 'GetEmoteSet',
						variables: { id: '01GD17VE2R000E0RPNH2V9Z16G' },
						query:
							'query GetEmoteSet($id: ObjectID!, $formats: [ImageFormat!]) { emoteSet(id: $id) { id name emotes { data { id name host { url files(formats: $formats) { name format } } } } } }'
					},
					{
						operationName: 'GetEmoteSet',
						variables: { id: '01HZKY8CFR0002X9JFJVAG7PKX' },
						query:
							'query GetEmoteSet($id: ObjectID!, $formats: [ImageFormat!]) { emoteSet(id: $id) { id name emotes { data { id name host { url files(formats: $formats) { name format } } } } } }'
					}
				] )
			} );

			const data = await response.json();

			if (
				!response.ok ||
				data?.[0]?.errors?.[0]?.message ||
				data?.[1]?.errors?.[0]?.message ||
				!data[0]?.data?.emoteSet?.emotes ||
				!data[1]?.data?.emoteSet?.emotes
			)
			{
				const errorMessage = [ data?.[0]?.errors?.[0]?.message ?? '', data?.[1]?.errors?.[0]?.message ?? '' ]
					.join( '/' );
				log( new Error( errorMessage ?? 'Unknown error with 7TV' ) );
				return;
			}

			seventv = data;
		}
		catch ( error: unknown )
		{
			log( error );
			return;
		}

		const emoteMap: TwitchEmote = {};
		for ( const emote of [ ...seventv[0].data.emoteSet.emotes, ...seventv[1].data.emoteSet.emotes ] )
		{
			// https://cdn.7tv.app/emote/60ae958e229664e8667aea38/1x.webp
			emoteMap[emote.data.name] = `${emote.data.host.url}/3x.webp`;
		}

		return emoteMap;
	}
}
