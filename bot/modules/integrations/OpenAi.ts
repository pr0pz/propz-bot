import { log } from '@shared/helpers.ts';

export class OpenAI
{
	public static async generate( message: string, user: string ): Promise<string>
	{
		const apiKey = Deno.env.get( 'OPENAI_API_KEY' );
		if ( !message || !apiKey ) return '';

		try
		{
			const system =
				`You are a stream chat assistant.Respond to viewer requests in their language, precisely and briefly.Use minimal emotes appropriately.Include literal username and convey slight annoyance.Mention "Propz_tv" as the streamer only if relevant.Limit responses to 200 characters.Avoid counter-questions.`;

			const response: Response = await fetch(
				'https://api.openai.com/v1/chat/completions',
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`
					},
					method: 'POST',
					body: JSON.stringify( {
						model: 'gpt-5-nano',
						messages: [
							{ role: 'system', content: system },
							{ role: 'user', content: `{username: ${user}, request: ${message}}` }
						],
						max_tokens: 100
					} )
				}
			);
			const data = await response.json();

			if ( !response.ok )
			{
				log( new Error( `${data.error.type} (${response.status}) › ${data.error.messge}` ) );
				return '';
			}
			return data?.choices?.[0]?.message?.content ?? '';
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}
}
