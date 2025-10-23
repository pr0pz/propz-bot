/**
 * Deepl
 *
 * @author Wellington Estevo
 * @version 1.6.0
 */

import { log } from '@propz/helpers.ts';

export class Deepl
{
	public static async translate( message: string, targetLang: string = 'de' ): Promise<string>
	{
		const apiKey = Deno.env.get( 'DEEPL_API_KEY' );
		if ( !message || !apiKey ) return '';

		try
		{
			const response: Response = await fetch(
				`https://api-free.deepl.com/v2/translate`,
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `DeepL-Auth-Key ${apiKey}`
					},
					method: 'POST',
					body: JSON.stringify( {
						text: [ message ],
						target_lang: targetLang
					} )
				}
			);
			const data = await response.json();

			if ( !response.ok )
			{
				log( new Error( `${response.status} › ${data.messge}` ) );
				return '';
			}
			return data?.translations?.[0]?.text ?? '';
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}
}
