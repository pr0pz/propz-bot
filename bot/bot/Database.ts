// deno-lint-ignore-file no-import-prefix
/**
 * DB handler
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import type { PreparedQuery } from 'https://deno.land/x/sqlite/mod.ts';

export class Database extends DB
{
	private static instance: Database;
	public preparedStatements: Map<string, PreparedQuery> = new Map();

	private constructor()
	{
		super( './bot/bot/BotData.sql' );
		this.initDatabase();
	}

	public static getInstance(): Database
	{
		if ( !Database.instance )
			Database.instance = new Database();

		return Database.instance;
	}

	public initDatabase(): void
	{
		try
		{
			const schema = Deno.readTextFileSync( './bot/bot/BotDataSchema.sql' );
			this.execute( schema );

			// Init prepared statements
			this.preparedStatements.set( 'getUserData',
				this.prepareQuery( `SELECT * FROM twitch_users WHERE id = ?` ) );

			this.preparedStatements.set( 'updateUserData',
				this.prepareQuery( `
					UPDATE twitch_users SET
						name = ?,
						color = ?,
						profile_picture = ?,
						follow_date = ?,
						message_count = ?,
						first_count = ?,
						sub_count = ?,
						gift_count = ?,
						gift_subs = ?,
						raid_count = ?,
						raid_viewers = ?
					WHERE id = ?;` ) );

			this.preparedStatements.set( 'updateStatsMessage',
				this.prepareQuery( 'UPDATE stream_stats SET message = message + 1 WHERE user_id = ?' ) );

			log( 'Database initialized ✅' );
		}
		catch( error: unknown ) { log( error ) }
	}

	/** Clean up everything DB related */
	public cleanupDatabase(): void
	{
		try
		{
			// Finalize all prepared statements
			for ( const [_name, stmt] of this.preparedStatements.entries() )
			{
				try
				{
					stmt.finalize();
				}
				catch ( error: unknown ) { log( error ) }
			}
			this.preparedStatements.clear();

			log( 'Database cleanup ♻️' );
		}
		catch( error: unknown ) { log( error ) }
	}

	/**
	 * Daily Cronjob tasks
	 */
	public static cronjobDaily(): void
	{
		const db = Database.getInstance();
		void db.execute( `DELETE FROM stream_stats;` );
		void db.cleanupDatabase();
		void db.initDatabase();
	}
}
