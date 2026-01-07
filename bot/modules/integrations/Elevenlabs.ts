/**
 * Elevenlabs
 *
 * @author Wellington Estevo
 * @version 2.2.1
 */

import { log } from "@shared/helpers.ts";
import { sample } from '@std/random';

export class Elevenlabs
{
	private static api_url = 'https://api.elevenlabs.io/v1/text-to-speech'
	private static voices = [
		'r0fLdYmTH96Lr4s10B6K', // Ramona
		'Qy4b2JlSGxY7I9M9Bqxb',	// Lisa
	]

	public static async generateTts( text: string ): Promise<string>
	{
		if ( !Deno.env.get( 'ELEVENLABS_API_KEY' ) ) return '';
		try
		{
			const response = await fetch( `${ this.api_url }/${ sample( Elevenlabs.voices ) }`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'xi-api-key': Deno.env.get( 'ELEVENLABS_API_KEY' )
				},
				body: JSON.stringify( {
					text: text,
					modelId: "eleven_multilingual_v2"
				} )
			} );
			//console.log( response );
			if ( !response.ok ) return '';
			//return await response.blob();

			const reader = new FileReader();
			reader.readAsDataURL( await response.blob() );

			return new Promise<string>((resolve, reject) =>
			{
				reader.onloadend = () =>
				{
					if ( reader.readyState !== 2 || !reader.result ) return reject('');
					// https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
					//console.log( reader.result );
					resolve( reader.result.toString() );
				}
			});
		}
		catch( error: unknown )
		{
			log( error );
			return '';
		}
	}
}
