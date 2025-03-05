/**
 * DB handler
 * 
 * @author Wellington Estevo
 * @version 1.5.10
 */

import type { PreparedQuery } from 'https://deno.land/x/sqlite/mod.ts';

import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { log } from '@propz/helpers.ts';

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
			// Create DB Schema
			const schema = Deno.readTextFileSync( './twitch-bot/bot/BotDataSchema.sql' );
			this.execute( schema );

			// Init prepared statements
			this.preparedStatements.set( 'add_user', 
				this.prepareQuery( 'INSERT OR IGNORE INTO twitch_users (id) VALUES (?)' ) );

			this.preparedStatements.set( 'get_user',
				this.prepareQuery( `
					SELECT
						id,
						name,
						profile_picture,
						color,
						follow_date,
						message_count,
						first_count
					FROM twitch_users
					WHERE id = ?` ) );

			this.preparedStatements.set( 'update_userdata', 
				this.prepareQuery( `
					UPDATE twitch_users SET
						name = ?,
						profile_picture = ?,
						color = ?,
						follow_date = ?,
						message_count = ?,
						first_count = ?
					WHERE id = ?;` ) );

			this.preparedStatements.set( 'update_stats_message',
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