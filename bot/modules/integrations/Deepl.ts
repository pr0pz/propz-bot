import { log, sanitizeMessage } from '@shared/helpers.ts';

import type { Twitch } from '@twitch/core/Twitch.ts';
import type { TwitchCommandOptions } from '@shared/types.ts';

export class Deepl
{
	public static async maybeTranslate( options: TwitchCommandOptions, twitch: Twitch ): Promise<string>
	{
		if ( !options.messageObject ) return '';
		// Check if command is sent as reply
		if ( options.messageObject.isReply )
		{
			const message = sanitizeMessage(
				options.messageObject.parentMessageText ?? ''
			);
			if ( twitch.chat.messageProcessor.isValidMessageText( message, options.messageObject ) )
			{
				const translation = await Deepl.translate(
					message,
					twitch.stream.language
				);
				void twitch.chat.sendMessage( translation, options.messageObject );
				return '';
			}
		}
		return await Deepl.translate(
			options.message,
			twitch.stream.language
		);
	}

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
