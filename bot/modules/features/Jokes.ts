/**
 * Joke
 *
 * @author Wellington Estevo
 * @version 2.2.1
 */

import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';

import type { ChatMessage } from '@twurple/chat';
import type { TwitchJoke, TwitchJokeRow } from '@shared/types.ts';

export class Jokes
{
	/** Add Joke
	 *
	 * @param {string} chatMessage Original chat message object
	 * @returns {string}
	 */
	public static add( chatMessage: ChatMessage ): string
	{
		if ( !chatMessage.isReply )
			return 'Error › Use !addjoke only as message reply';

		if ( !chatMessage.parentMessageText )
			return 'Error › Quote text is empty';

		if ( !chatMessage.parentMessageUserId )
			return 'Error › Invalid Author';

		const joke: TwitchJoke = {
			text: chatMessage.parentMessageText.sanitize(),
			user_id: chatMessage.parentMessageUserId.sanitize()
		};

		const logText = `t: ${joke.text} / u: ${joke.user_id}`;
		log( logText );
		// return logText;

		const db = Database.getInstance();
		try
		{
			db.query(
				`INSERT INTO twitch_jokes (text, user_id) VALUES (?, ?)`,
				[ joke.text, joke.user_id ]
			);
		}
		catch ( error: unknown ) { log( error ) }

		return db.lastInsertRowId.toString();
	}

	/** Get random joke */
	public static get( jokeId: number = 0 ): string
	{
		try
		{
			const db = Database.getInstance();
			const joke = db.queryEntries<TwitchJokeRow>(
				`SELECT
				   q.id,
				   q.text,
				   q.user_id,
				   u.name  -- Include the username from users table
				FROM twitch_jokes q
				LEFT JOIN twitch_users u ON q.user_id = u.id
				WHERE (? = 0 OR q.id = ?)  -- If jokeId is 0, this becomes TRUE for all rows
				ORDER BY RANDOM()
				LIMIT 1`,  [ jokeId, jokeId ] );

			return joke.length === 0 ? '' : `${joke[0].text} - ${joke[0].name} [ #${joke[0].id} ]`;
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}
}
