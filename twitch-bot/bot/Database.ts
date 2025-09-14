/**
 * DB handler
 *
 * @author Wellington Estevo
 * @version 1.7.19
 */

import { log } from '@propz/helpers.ts';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';

export class Database extends DB
{
	private static instance: Database;

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
			log( 'Database initialized ✅' );
		}
		catch ( error: unknown ) { log( error ) }
	}
}
