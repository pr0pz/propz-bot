import { Database } from '@services/Database.ts';
import { log } from '@shared/helpers.ts';

import type { RowObject } from 'https://deno.land/x/sqlite/mod.ts';
import type { SimpleUser } from '@shared/types.ts';

export class StreamStats
{
	/** Get all Stream Stats */
	public static get(): RowObject[]
	{
		try
		{
			const db = Database.getInstance();
			return db.queryEntries( `
				SELECT
					s.user_id,
					u.name,
					u.profile_picture,
					u.color,
					s.message,
					s.cheer,
					s.follow,
					s.raid,
					s.first_chatter,
					s.sub,
					s.subgift
				FROM stream_stats s
				LEFT JOIN twitch_users u ON s.user_id = u.id
			` );
		}
		catch ( error: unknown ) { log( error ) }
		return [];
	}

	/** Update Stream stats
	 *
	 * @param {SimpleUser} user User Object
	 * @param {string} eventType
	 * @param {number} eventCount
	 */
	public static update(
		user: SimpleUser,
		eventType: string,
		eventCount: number = 1
	): void
	{
		if ( !user?.id || !eventType ) return;

		try
		{
			const db = Database.getInstance();
			db.query(
				`INSERT OR IGNORE INTO stream_stats (user_id) VALUES (?)`,
				[ user.id ]
			);

			switch ( eventType )
			{
				case 'first_chatter':
					db.query(
						`UPDATE stream_stats SET first_chatter = 1 WHERE user_id = ?`,
						[ user.id ]
					);
					break;

				case 'follow':
					db.query(
						`UPDATE stream_stats SET follow = 1 WHERE user_id = ?`,
						[ user.id ]
					);
					break;

				case 'message':
					db.preparedStatements.get( 'updateStatsMessage' )?.execute( [ user.id ] );
					break;

				case 'cheer':
					db.query(
						`UPDATE stream_stats SET cheer = cheer + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'raid':
					db.query(
						`UPDATE stream_stats SET raid = raid + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'sub':
				case 'resub-1':
				case 'resub-2':
				case 'resub-3':
				case 'resub-4':
				case 'resub-5':
					db.query(
						`UPDATE stream_stats SET sub = sub + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'subgift':
				case 'communitysub-1':
				case 'communitysub-2':
				case 'communitysub-3':
				case 'communitysub-4':
				case 'communitysub-5':
				case 'communitysub-6':
				case 'communitysub-7':
					db.query(
						`UPDATE stream_stats SET subgift = subgift + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;
			}
		}
		catch ( error: unknown ) { log( error ) }
	}
}
