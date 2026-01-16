import { log } from '@shared/helpers.ts';
import type { SevenTVApiResponse, SevenTVEmoteSet, SevenTVEmote } from '@shared/types.ts';

export class SevenTV
{
	static cdnUrl = 'https://cdn.7tv.app/emote/{emoteId}/4x.webp';

	/** Fetch 7TV Emotes
	 *
	 * global: 01GD17VE2R000E0RPNH2V9Z16G
	 * propz: 01HZKY8CFR0002X9JFJVAG7PKX
	 *
	 * @returns {Promise<TwitchEmote|undefined>}
	 */
	public static async getEmotes(): Promise<Map<string, string> | undefined>
	{
		let seventv: SevenTVEmoteSet[];
		try
		{
			const response = await fetch( 'https://7tv.io/v4/gql', {
				method: 'post',
				body: JSON.stringify(
					{
						query: `
						{
							emoteSets {
								emoteSets(ids: [ "01GD17VE2R000E0RPNH2V9Z16G", "01HZKY8CFR0002X9JFJVAG7PKX" ]) {
									id
									name
									emotes(page: 1, perPage: 300) {
										items {
											alias
											emote {
												defaultName
												id
											}
										}
									}
								}
							}
						}`
					}
				)
			} );

			const json = await response.json() as SevenTVApiResponse;

			if (
				!response.ok ||
				!json?.data ||
				json.errors?.[0]?.message ||
				!json.data.emoteSets?.emoteSets
			)
			{
				log( new Error( json.errors?.[0]?.message ?? 'Unknown error with 7TV' ) );
				return;
			}

			seventv = json.data.emoteSets.emoteSets;
		}
		catch ( error: unknown )
		{
			log( error );
			return;
		}

		const emoteMap: Map<string, string> = new Map();
		for ( const emote of [ ...seventv[0].emotes.items, ...seventv[1].emotes.items ] )
		{
			emoteMap.set( emote.alias, SevenTV.cdnUrl.replace( '{emoteId}', emote.emote.id ) );
		}

		return emoteMap;
	}
}
