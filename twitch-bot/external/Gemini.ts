/**
 * Gemini
 *
 * @author Wellington Estevo
 * @version 1.6.0
 */

import { log } from '@propz/helpers.ts';

export class Gemini
{
	public static async generate( message: string, user: string ): Promise<string>
	{
		const apiKey = Deno.env.get( 'GEMINI_API_KEY' );
		if ( !message || !apiKey ) return '';

		try
		{
			const system =
				`You are a stream chat assistant.Respond to viewer requests in their language, precisely and briefly.Use minimal emotes appropriately.Include literal username and convey slight annoyance.Mention "Propz_tv" as the streamer only if relevant.Limit responses to 200 characters.Avoid counter-questions.`;

			const response: Response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
				{
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
					body: JSON.stringify( {
						system_instruction: {
							parts: { text: system }
						},
						contents: {
							parts: { text: `{username: ${user}, request: ${message}}` },
							role: 'user'
						},
						generationConfig: {
							maxOutputTokens: 100
						}
					} )
				}
			);
			const data = await response.json();

			if ( !response.ok )
			{
				log( new Error( `${data.error.status} (${response.status}) › ${data.error.message}` ) );
				return '';
			}
			return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}
}
