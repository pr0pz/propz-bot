/**
 * Deepl
 *
 * @author Wellington Estevo
 * @version 1.10.6
 */

import { log } from '@propz/helpers.ts';

import type { TwitchUtils } from "../twitch/Twitch.ts";
import type { TwitchCommandOptions } from '@propz/types.ts';

export class Deepl
{
	public static async maybeTranslate( options: TwitchCommandOptions, twitch: TwitchUtils )
	{
		if ( !options.messageObject ) return '';
		// Check if command is sent as reply
		if ( options.messageObject.isReply )
		{
			const message = sanitizeMessage(
				options.messageObject.parentMessageText ?? ''
			);
			if ( twitch.chat.chatHelper.isValidMessageText( message, options.messageObject ) )
			{
				const translation = await Deepl.translate(
					message,
					twitch.streamLanguage
				);
				void twitch.chat.sendMessage( translation, options.messageObject );
				return '';
			}
		}
		return await Deepl.translate(
			options.message,
			twitch.streamLanguage
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
