import { Database } from '@services/Database.ts';
import { sample, shuffle } from '@std/random';

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
		if ( results.length === 0 ) return;

		let i = 0;
		const users = shuffle( results );
		while( i < winnerCount )
		{
			if ( users.length === 0 ) return;
			const winnerUser = sample( users )!;
			winners.push( winnerUser );
			users.splice( results.indexOf( winnerUser ), 1 );
			// Delete winner from db
			//db.query( `DELETE FROM giveaway WHERE user_id = ?`, [ winnerUser[0] ] );
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
