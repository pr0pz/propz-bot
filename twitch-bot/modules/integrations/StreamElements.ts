/**
 * Streamelements Controller
 *
 * https://dev.streamelements.com/docs/api-docs/5fff39cc30655-channel-redemptions
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import type { StreamElementsViewerStats } from '@shared/types.ts';

export class StreamElements
{
	/** Get viewer stats
	 *
	 *	StreamElementsViewerStats {
			"channel": "XXX",
			"username": "viewerName",
			"points": 123,
			"pointsAlltime": 123,
			"watchtime": 123,
			"rank": 1
		}
	 *
	 * @param userName
	 */
	public static async getViewerStats(
		userName: string
	): Promise<StreamElementsViewerStats | undefined>
	{
		const seAccountId = Deno.env.get( 'SE_ACCOUNT_ID' ) || '';
		const seJwtToken = Deno.env.get( 'SE_JWT_TOKEN' ) || '';
		const url = `https://api.streamelements.com/kappa/v2/points/${seAccountId}/${userName}`;
		try
		{
			const response: Response = await fetch( url, {
				method: 'get',
				headers: new Headers( {
					Authorization: 'Bearer ' + seJwtToken,
					'Content-Type': 'application/json'
				} )
			} );
			const data = await response.json();

			if ( !response.ok )
			{
				log( new Error( `${data.error} (${data.statusCode}) › ${data.message}` ) );
				return;
			}

			return data as StreamElementsViewerStats;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}
}
