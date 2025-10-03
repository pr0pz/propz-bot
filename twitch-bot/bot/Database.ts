/**
 * DB handler
 *
 * @author Wellington Estevo
 * @version 1.9.1
 */

import { log } from '@propz/helpers.ts';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import type { PreparedQuery } from 'https://deno.land/x/sqlite/mod.ts';

export class Database extends DB
{
	private static instance: Database;
	public preparedStatements: Map<string, PreparedQuery> = new Map();

	private constructor()
	{
		super( './twitch-bot/bot/BotData.sql' );
		this.initDatabase();
	}

	static getInstance(): Database
	{
		if ( !Database.instance )
			Database.instance = new Database();

		return Database.instance;
	}

	public initDatabase()
	{
		try
		{
			const schema = Deno.readTextFileSync( './twitch-bot/bot/BotDataSchema.sql' );
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
	public cleanupDatabase()
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
}
