/**
 * Counters
 *
 * @author Wellington Estevo
 * @version 2.3.0
 */

import { Database } from '@services/Database.ts';
import type { TwitchCounter, TwitchCounterRow } from '@shared/types.ts';

export class Counters
{
	public static get( key: string ): TwitchCounter | undefined
	{
		if ( !key )	return;
		const db = Database.getInstance();

		const result = db.queryEntries<TwitchCounterRow>( `SELECT key, value, created, updated FROM twitch_counters WHERE key = ?`, [ key ] );
		if ( result.length === 0 ) return;

		return result[0] as TwitchCounter;
	}

	public static update( key: string ): TwitchCounter|undefined
	{
		if ( !key ) return;
		const db = Database.getInstance();

		const result = db.queryEntries<TwitchCounterRow>( `SELECT key, value, created, updated FROM twitch_counters WHERE key = ?`, [ key ] );

		// Insert if not found
		if ( result.length === 0 )
		{
			db.query( `INSERT INTO twitch_counters (key) VALUES (?)`, [ key ] );
			return {
				key: key,
				value: 1,
				created: Date.now() / 1000,
				updated: Date.now() / 1000
			} as TwitchCounter;
		}
		else
		{
			db.query( `UPDATE twitch_counters SET value = value + 1 WHERE key = ?`, [ key ] );
			result[0].value++;
			return result[0] as TwitchCounter;
		}
	}
}
