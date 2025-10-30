/**
 * Joke
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { getRandomNumber, log } from '@shared/helpers.ts';
import { Database } from '@bot/Database.ts';

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
			let jokeIndex = jokeId;
			if ( jokeIndex < 1 )
			{
				const totalJokes = db.queryEntries( `SELECT COUNT(*) as count FROM twitch_jokes` );

				if ( !totalJokes?.[0]?.count )
					return '';

				jokeIndex = getRandomNumber( Number( totalJokes[0].count ), 1 );
			}

			const joke = db.queryEntries<TwitchJokeRow>( `
				SELECT 
					q.id,
					q.text,
					q.user_id,
					u.name  -- Include the username from users table
				FROM twitch_jokes q
				LEFT JOIN twitch_users u ON q.user_id = u.id
				WHERE q.id = ?
				ORDER BY q.id`, [ jokeIndex ] );

			return joke.length === 0 ? '' : `${joke[0].text} - ${joke[0].name} [ #${jokeIndex} ]`;
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}
}
