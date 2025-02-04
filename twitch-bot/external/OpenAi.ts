/**
 * OpenAI
 * 
 * @author Wellington Estevo
 * @version 1.2.5
 */

import { log } from '@propz/helpers.ts';
import { OpenAI as OpenAiRemote } from 'openai';

export class OpenAI
{
	public static async handleAiRequest( message: string, user: string )
	{
		const apiKey = Deno.env.get( 'OPENAI_API_KEY' ) || '';
		if ( !message || !apiKey ) return '';

		try
		{
			const openai = new OpenAiRemote({ apiKey: apiKey });
			const system = `Each request comes from a livestream viewer. Respond in the language of the request, briefly and precisely. No counter-questions, no emotes. Mention the username. Always respond slightly annoyed. Max +- 200 characters (never ignore). Only suggest Propz_tv as the streamer (if makes sense for the answer).`;

			// ca. 200 tokens pro anfrage
			const response = await openai.chat.completions.create({
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: message, name: user || '' }
				],
				model: 'gpt-4o-mini',
				max_completion_tokens: 100
			});

			return response.choices?.[0]?.message?.content || '';
		}
		catch( error: unknown )
		{
			log( error );
			return '';
		}
	}
}