/**
 * OpenWeather
 * 
 * @author Wellington Estevo
 * @version 1.3.0
 */

import { log } from '@propz/helpers.ts';
import type { OpenWeatherResponse, WeatherData } from '@propz/types.ts';

export class OpenWeather
{
	public static async handleWeatherRequest( cityName: string, countryCode?: string, language:string = 'de' ): Promise<WeatherData|undefined>
	{
		const apiKey = Deno.env.get( 'OPENWEATHER_API_KEY' ) || '';
		if ( !cityName || !apiKey ) return;

		let cityData = cityName;
		if ( countryCode )
			cityData += `,${countryCode}`;
		
		let data: OpenWeatherResponse;
		try
		{
			const response = await fetch( `https://api.openweathermap.org/data/2.5/weather?q=${ cityData }&appid=${ apiKey }&units=metric&lang=${language}` );
			if ( !response.ok ) return;

			data = await response.json();
			if ( !data?.main || !data?.weather ) return;
		}
		catch( error: unknown )
		{
			log( error );
			return;
		}

		return {
			cityName: data.name || '',
			countryCode: data.sys.country || '',
			description: data.weather[0].description || '',
			feelsLike: data.main.feels_like ? Math.round( data.main.feels_like ).toString() : '',
			humidity: data.main.humidity ? Math.round( data.main.humidity ).toString() : '',
			temp: data.main.temp ? Math.round( data.main.temp ).toString() : '',
			icon: data.weather[0].icon || '',
			iconUrl: data.weather[0].icon ? `https://openweathermap.org/img/wn/${ data.weather[0].icon }@4x.png` : ''
		}		
	}
}