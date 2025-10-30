/**
 * Twitch Utils
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { Database } from '@bot/Database.ts';
import { getRandomNumber } from '@shared/helpers.ts';

export class Giveaway
{
	/**
	 * Reset giveaway table for new giveaway
	 */
	public static start(): void
	{
		const db = Database.getInstance();
		db.query( `DELETE FROM giveaway` );
	}

	/**
	 * Return winning userId
	 *
	 * @returns {number}
	 */
	public static pickWinners( winnerCount: number = 1, date: string = '' ): undefined|string[][]
	{
		const db = Database.getInstance();
		const winners = [];

		const results = db.query<string[]>(
			`SELECT
				 g.user_id,
				 u.name
			FROM giveaway g
			LEFT JOIN twitch_users u ON g.user_id = u.id
			WHERE date <= ?;`,
			date ? [ Date.parse( date ) ] : [ Date.now() ]
		);
		if ( !results ) return;

		let i = 0;
		while( i < winnerCount )
		{
			const winnerUser = results[ getRandomNumber( results.length - 1, 0 ) ];
			winners.push( winnerUser );
			// Delete winner from db
			db.query( `DELETE FROM giveaway WHERE user_id = ?`, [ winnerUser[0] ] );
			i++;
		}
		if ( !winners ) return;
		return winners;
	}

	/**
	 * Adds userId as participant
	 *
	 * @param {number | string} userId
	 */
	public static join( userId: number|string ): void
	{
		if ( !userId ) return;
		const db = Database.getInstance();
		db.query( `INSERT OR IGNORE INTO giveaway ( user_id, date ) VALUES ( ?, unixepoch() );`, [ userId ] );
	}

}
