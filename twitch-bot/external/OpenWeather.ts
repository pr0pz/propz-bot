/**
 * OpenWeather
 * 
 * @author Wellington Estevo
 * @version 1.2.1
 */

import { log } from '@propz/helpers.ts';
import type { WeatherData } from '@propz/types.ts';

export class OpenWeather
{
	public static async handleWeatherRequest( cityName: string, countryCode: string ): Promise<WeatherData>
	{
		const apiKey = Deno.env.get( 'OPENWEATHER_API_KEY' ) || '';
		if ( !cityName || !countryCode || !apiKey ) return {};
		
		let data;
		try
		{
			const response = await fetch( `https://api.openweathermap.org/data/2.5/weather?q=${ cityName },${ countryCode }&appid=${ apiKey }&units=metric` );
			if ( !response.ok ) return {};

			data = await response.json();
			if ( !data?.main?.temp || !data.weather?.[0]?.icon ) return {};
		}
		catch( error: unknown )
		{
			log( error );
			return {};
		}

		return {
			temp: data.main.temp,
			icon: data.weather[0].icon,
			iconUrl: `https://openweathermap.org/img/wn/${ data.weather[0].icon }@4x.png`
		}		
	}
}