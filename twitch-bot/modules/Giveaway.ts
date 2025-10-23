/**
 * Twitch Utils
 *
 * @author Wellington Estevo
 * @version 1.10.0
 */

import { Database } from "../bot/Database.ts";
import { getRandomNumber } from "@propz/helpers.ts";

export class Giveaway
{
	/**
	 * Reset giveaway table for new giveaway
	 */
	public static startGiveaway(): void
	{
		const db = Database.getInstance();
		db.query( `DELETE FROM giveaway` );
	}

	/**
	 * Return winning userId
	 *
	 * @returns {number}
	 */
	public static pickWinner(): string
	{
		const db = Database.getInstance();
		const results = db.query( `SELECT user_id FROM giveaway;` );
		return results[ getRandomNumber( results.length - 1, 0 ) ][0] as string;
	}

	/**
	 * Adds userId as participant
	 *
	 * @param {number | string} userId
	 */
	public static joinGiveaway( userId: number|string ): void
	{
		if ( !userId ) return;
		const db = Database.getInstance();
		db.query( `INSERT OR IGNORE INTO giveaway ( user_id, date ) VALUES ( ?, CURRENT_TIMESTAMP );`, [ userId ] );
	}

}
