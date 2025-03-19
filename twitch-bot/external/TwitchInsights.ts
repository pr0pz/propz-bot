/**
 * TwitchInsights
 *
 * @author Wellington Estevo
 * @version 1.6.0
 */

import { log } from '@propz/helpers.ts';
import type { TwitchInsightsBot } from '@propz/types.ts';

export class TwitchInsights
{
	/** Get current bot list  */
	public static async getBots()
	{
		const twitchBots: string[] = [];
		const botWhitelist = [ '7tvApp', 'amazeful', 'amazefulbot', 'buttsbot', 'creatisbot', 'dinu', 'fossabot',
			'lattemotte', 'logviewer', 'lolrankbot', 'mikuia', 'mirrobot', 'moobot', 'nightbot', 'overrustlelogs',
			'own3d', 'playwithviewersbot', 'pokemoncommunitygame', 'rainmaker', 'restreambot', 'sery_bot',
			'songlistbot', 'soundalerts', 'streamdeckerbot', 'streamelements', 'streamholics', 'streamjar', 'streamkit',
			'streamlabs', 'tipeeebot', 'vivbot', 'wizebot', 'wzbot' ];

		let bots: TwitchInsightsBot[];
		try
		{
			const response = await fetch( 'https://api.twitchinsights.net/v1/bots/all' );
			const data = await response.json();

			if ( data?.error )
			{
				log( new Error( `${data.error} (${data.status})` ) );
				return twitchBots;
			}

			if ( !data?.bots )
			{
				log( new Error( `Couldn't fetch bots` ) );
				return twitchBots;
			}

			bots = data.bots as TwitchInsightsBot[];
		}
		catch ( error: unknown )
		{
			log( error );
			return twitchBots;
		}

		for ( const bot of bots )
		{
			if ( !bot[0] || botWhitelist.includes( bot[0] ) ) continue;
			twitchBots.push( bot[0] );
		}

		return twitchBots;
	}
}
