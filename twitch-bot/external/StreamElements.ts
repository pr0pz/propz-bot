/**
 * Streamelements Controller
 * 
 * https://dev.streamelements.com/docs/api-docs/5fff39cc30655-channel-redemptions
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import type { StreamElementsError, StreamElementsViewerStats } from '@propz/types.ts';
import { log } from '@propz/helpers.ts';

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
	 * @param {string} viewerName - Viewer to look for
	 */
	public static async getViewerStats( userName: string ): Promise<StreamElementsViewerStats|StreamElementsError|undefined>
	{
		const seAccountId = Deno.env.get( 'SE_ACCOUNT_ID' ) || '';
		const seJwtToken = Deno.env.get( 'SE_JWT_TOKEN' ) || '';
		const url = `https://api.streamelements.com/kappa/v2/points/${ seAccountId }/${ userName }`;
		try
		{
			const response: Response = await fetch( url, { 
				method: 'get', 
				headers: new Headers({
					'Authorization': 'Bearer ' + seJwtToken, 
					'Content-Type': 'application/json'
				})
			});

			return await response.json() as StreamElementsViewerStats|StreamElementsError;
		}
		catch( error: unknown ) { log( error ) }
	}
}