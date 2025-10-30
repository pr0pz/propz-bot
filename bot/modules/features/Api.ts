/**
 * API Features
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log, mapToObject } from '@shared/helpers.ts';
import { OpenWeather } from '@integrations/OpenWeather.ts';
import { StreamStats } from '@services/StreamStats.ts';

import type { ApiRequest, ApiResponse, KofiData, SimpleUser } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';
import type { HelixUser } from '@twurple/api';

export class Api
{
	constructor( private twitch: Twitch ) {}

	/** Handle API calls
	 *
	 * @param {ApiRequest} apiRequest
	 */
	public async process( apiRequest: ApiRequest ): Promise<ApiResponse>
	{
		const response: ApiResponse = { data: false };
		if ( !apiRequest?.request ) return response;

		let user: HelixUser | SimpleUser | null = await this.twitch.userHelper.getUser();
		if ( !user ) return response;

		user = await this.twitch.userHelper.convertToSimplerUser( user );

		if ( apiRequest.request.startsWith( 'command-' ) )
		{
			const commandName = apiRequest.request.replace( 'command-', '!' );
			void this.twitch.commands.process( commandName, null, user );
			response.data = true;
			return response;
		}

		switch ( apiRequest.request )
		{
			case 'chatCommands':
				response.data = Object.fromEntries( this.twitch.commands.get() );
				break;

			case 'getStreamStats':
				response.data = StreamStats.get();
				break;

			case 'getEmotes':
				response.data = this.twitch.emotes.get();
				break;

			case 'getStream':
				response.data = this.twitch.stream.forApi() || false;
				break;

			case 'isStreamActive':
				response.data = this.twitch.stream.isActive;
				break;

			case 'getEvents':
				response.data = mapToObject( this.twitch.streamEvents.getAll() );
				break;

			case 'getLastEvents':
				response.data = this.twitch.streamEvents.getLast( this.twitch.stream.language );
				break;

			case 'getWeather':
				if (
					!apiRequest.data?.cityName &&
					(
						!apiRequest.data?.lat &&
						!apiRequest.data?.lon
					)
				) return response;

				response.data = await OpenWeather.handleWeatherRequest(
					apiRequest.data.cityName || '',
					apiRequest.data.countryCode || '',
					apiRequest.data.lat || '',
					apiRequest.data.lon || ''
				) ?? false;
				break;
		}

		return response;
	}

	/** Handle kofi event
	 *
	 * @param {KofiData} kofiData Webhook data passed from ko-fi.com
	 */
	public handleKofiWebhook( kofiData: KofiData ): number
	{
		if (
			!kofiData?.type ||
			!kofiData?.amount ||
			kofiData?.verification_token !== Deno.env.get( 'KOFI_TOKEN' )
		) return 400;

		log( `Webhook: Kofi ${ kofiData.type }` );

		const type = 'kofi' + kofiData.type.trim().replace( ' ', '' ).toLowerCase();
		const name = kofiData.from_name || 'anonymous';

		void this.twitch.events.eventProcessor.process( {
			eventType: type,
			user: name,
			eventCount: parseFloat( kofiData.amount ),
			eventText: kofiData.message || '',
			isTest: (name == 'Jo Example')
		} );

		return 200;
	}
}
