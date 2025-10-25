/**
 * Quote
 *
 * @author Wellington Estevo
 * @version 1.10.7
 */

import { getRandomNumber, log } from "@propz/helpers.ts";
import { Database } from "../bot/Database.ts";
import { Youtube } from "@modules/Youtube.ts";

import type { ChatMessage } from "@twurple/chat";
import type { HelixStream } from "@twurple/api";
import type { TwitchQuote, TwitchQuoteRow } from "@propz/types.ts";

export class Quotes
{
	/** Add Quote
	 *
	 * @param {string} chatMessage Original chat message object
	 * @param {HelixStream} stream Current Stream object
	 * @returns {Promise<string>}
	 */
	static async add( chatMessage: ChatMessage, stream: HelixStream|undefined ): Promise<string>
	{
		if ( !chatMessage.isReply )
			return 'Error › Use !addquote only as message reply';

		if ( !chatMessage.parentMessageText )
			return 'Error › Quote text is empty';

		if ( !chatMessage.parentMessageUserId )
			return 'Error › Invalid Author';

		const videoId = await Youtube.getCurrentLivestreamVideoId();
		const videoTimestamp = stream?.startDate ?
			Math.floor( ( Date.now() - stream.startDate.timestamp() ) / 1000 ) - 20:
			0;

		const quote: TwitchQuote = {
			date: new Date().toISOString(),
			category: stream?.gameName || '',
			text: chatMessage.parentMessageText.sanitize(),
			user_id: chatMessage.parentMessageUserId.sanitize(),
			vod_url: Youtube.getYoutubeVideoUrlById( videoId, videoTimestamp )
		};

		const logText = `cat: ${quote.category} / t: ${quote.text} / u: ${quote.user_id} / vidid: ${videoId} / vidt: ${videoTimestamp} / vod: ${quote.vod_url}`;
		log( logText );
		// return logText;

		const db = Database.getInstance();
		try
		{
			db.query(
				`INSERT INTO twitch_quotes (date, category, text, user_id, vod_url) VALUES (?, ?, ?, ?, ?)`,
				[ quote.date, quote.category, quote.text, quote.user_id, quote.vod_url ]
			);
		}
		catch ( error: unknown ) { log( error ) }
		return db.lastInsertRowId.toString();
	}

	/** Get random quote */
	static get( quoteId: number = 0 ): string
	{
		try
		{
			const db = Database.getInstance();
			let quoteIndex = quoteId;
			if ( quoteIndex < 1 )
			{
				const totalQuotes = db.queryEntries( `SELECT COUNT(*) as count FROM twitch_quotes` );

				if ( !totalQuotes?.[0]?.count )
					return '';

				quoteIndex = getRandomNumber( Number( totalQuotes[0].count ), 1 );
			}

			const quote = db.queryEntries<TwitchQuoteRow>( `
				SELECT 
					q.id,
					q.date,
					q.category,
					q.text,
					q.user_id,
					q.vod_url,
					u.name  -- Include the username from users table
				FROM twitch_quotes q
				LEFT JOIN twitch_users u ON q.user_id = u.id
				WHERE q.id = ?
				ORDER BY q.id`, [ quoteIndex ] );

			if ( quote.length === 0 )
				return '';

			const date = new Date( Date.parse( quote[0].date ) );
			let message = `${quote[0].text} - ${quote[0].name} [ #${quoteIndex} / ${
				date.toLocaleDateString( 'de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				} )
			}`;

			if ( quote[0].vod_url )
				message += ` / ${quote[0].vod_url}`;

			return message + ' ]';
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}
}
