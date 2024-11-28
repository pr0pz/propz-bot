/**
 * TwitchInsights
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import type { TwitchInsightsBot, TwitchInsightsBots } from '@propz/types.ts';
import { log } from '@propz/helpers.ts';

export class TwitchInsights
{
	/** Get current bot list  */
	public static async getBots()
	{
		const twitchBots: string[] = []
		const botWhitelist = [ '7tvApp', 'amazeful', 'amazefulbot', 'buttsbot', 'creatisbot', 'dinu', 'fossabot', 'lattemotte', 'logviewer', 'lolrankbot', 'mikuia', 'mirrobot', 'moobot', 'nightbot', 'overrustlelogs', 'own3d', 'playwithviewersbot', 'pokemoncommunitygame', 'rainmaker', 'restreambot', 'sery_bot', 'songlistbot', 'soundalerts', 'streamdeckerbot', 'streamelements', 'streamholics', 'streamjar', 'streamkit', 'streamlabs', 'tipeeebot', 'vivbot', 'wizebot', 'wzbot' ];

		let bots: TwitchInsightsBot[];
		try
		{
			const response = await fetch( 'https://api.twitchinsights.net/v1/bots/all' );
			if ( !response ) return twitchBots;

			const responseJson: TwitchInsightsBots = await response.json();
			if ( !responseJson?.bots ) return twitchBots;

			bots = responseJson.bots;
		}
		catch( error: unknown )
		{
			log( error );
			return twitchBots;
		}

		for( const bot of bots )
		{
			if ( !bot[0] || botWhitelist.includes( bot[0] ) ) continue;
			twitchBots.push( bot[0] );
		}

		return twitchBots;
	}
}