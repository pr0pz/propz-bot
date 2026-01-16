import { log } from '@shared/helpers.ts';

export class Gemini
{
	public static async generate( message: string, user: string ): Promise<string>
	{
		const apiKey = Deno.env.get( 'GEMINI_API_KEY' );
		if ( !message || !apiKey ) return '';

		try
		{
			const system =
				`You are a witty stream chat assistant. Respond in the viewer's language, briefly and precisely. Optionally address them with @${user} at the start. Use minimal emotes. Show slight sass and annoyance. Only mention "Propz_tv" (the streamer) if directly relevant. Keep responses under 200 characters. Never ask questions back. Be direct and natural.`;

			const response: Response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
				{
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
					body: JSON.stringify( {
						system_instruction: {
							parts: { text: system }
						},
						contents: {
							parts: { text: message },
							role: 'user'
						},
						generationConfig: {
							maxOutputTokens: 100,
							temperature: 0.9
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
