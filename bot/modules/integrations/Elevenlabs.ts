import { log } from "@shared/helpers.ts";
import { sample } from '@std/random';

export class Elevenlabs
{
	private static api_url = 'https://api.elevenlabs.io/v1/text-to-speech'
	private static voices = [
		'pFZP5JQG7iQjIQuC4Bku', // Lily
		'r0fLdYmTH96Lr4s10B6K', // Ramona (paid)
		'Qy4b2JlSGxY7I9M9Bqxb',	// Lisa (paid)
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
			/**
			 * {
			 *   "detail": {
			 *     "type": "payment_required",
			 *     "code": "paid_plan_required",
			 *     "message": "Free users cannot use library voices via the API. Please upgrade your subscription to use this voice.",
			 *     "status": "payment_required",
			 *     "request_id": "xxx"
			 *   }
			 * }
			 */
			if ( !response.ok )
			{
				const data = await response.json();
				log( new Error(`(${response.status}) ${ data?.detail?.type ?? '' }: ${data?.detail?.message ?? ''}`) );
				return '';
			}
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
