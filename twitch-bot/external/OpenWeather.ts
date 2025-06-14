/**
 * OpenWeather
 *
 * @author Wellington Estevo
 * @version 1.6.7
 */

import {log} from '@propz/helpers.ts';
import type {OpenWeatherResponse, WeatherData} from '@propz/types.ts';

export class OpenWeather
{
	public static async handleWeatherRequest(
		cityName?: string,
		countryCode?: string,
		lat?: string,
		lon?: string,
		language: string = 'de'
	): Promise<WeatherData | null>
	{
		const apiKey = Deno.env.get('OPENWEATHER_API_KEY') || '';
		if (!apiKey) return null;

		let url = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric&lang=${language}`;

		if (cityName)
		{
			url += `&q=${cityName}`;
			if (countryCode) url += `,${countryCode}`;
		}

		if (lat && lon)
			url += `&lat=${lat}&lon=${lon}`;

		//console.log(url);

		let data: OpenWeatherResponse;
		try
		{
			const response = await fetch(url);
			data = await response.json();

			if (!response.ok)
			{
				log(new Error(`${data.cod} › ${data.message}`));
				return null;
			}

			if (!data?.main || !data?.weather) return null;
		} catch (error: unknown)
		{
			log(error);
			return null;
		}

		return {
			cityName: data.name || '',
			countryCode: data.sys.country || '',
			description: data.weather[0].description || '',
			feelsLike: data.main.feels_like ? Math.round(data.main.feels_like).toString() : '',
			humidity: data.main.humidity ? Math.round(data.main.humidity).toString() : '',
			temp: data.main.temp ? Math.round(data.main.temp).toString() : '',
			icon: data.weather[0].icon || '',
			iconUrl: data.weather[0].icon ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png` : ''
		};
	}
}
