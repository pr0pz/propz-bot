/**
 * First Chatter
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import { BotData } from '@services/BotData.ts';
import { Database } from '@services/Database.ts';
import { StreamStats } from '@modules/features/StreamStats.ts';
import { UserData } from '@modules/features/UserData.ts';

import type { SimpleUser } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class FirstChatter
{
	constructor( private twitch: Twitch ) {}

	public get(): string
	{
		try
		{
			const db = Database.getInstance();
			const result = db.query( `
				SELECT u.name
				FROM stream_stats s
				LEFT JOIN twitch_users u ON s.user_id = u.id
				WHERE first_chatter = 1
				LIMIT 1;` );
			return result?.[0]?.[0]?.toString() || '';
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}

	/** Check and set firstchatter of each stream
	 *
	 * @param {SimpleUser} user user data
	 */
	public set( user: SimpleUser ): void
	{
		if (
			this.get() ||
			user?.name ===  BotData.broadcasterName ||
			user.name ===  BotData.botName
		) return;

		UserData.update( user, 'first_count' );
		StreamStats.update( user, 'first_chatter' );

		log( `First chatter goes to: ${ user.displayName }` );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'firstchatter',
			user: user.displayName
		} );
	}
}
