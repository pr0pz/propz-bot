/**
 * Weather
 * 
 * @author Wellington Estevo
 * @version 1.2.0
 */

import { useEffect, useState } from 'react';

const Weather = () =>
{
	const [worked, setWorked] = useState( false );
	const [temp, setTemp] = useState( '' );
	const [image, setImage] = useState( '' );
	const [classes, setClasses] = useState( '' );

	// API Documentation: https://openweathermap.org/current
	const options = {
		// Your API key from openweathermap.org
		apiKey: '69d76b19c08b267f7ad315765578877d',
		// Unit type: standard (kelvin), metric (celsius) or imperial (fahrenheit)
		unitType: 'metric',
		// City + Country Code (https://en.wikipedia.org/wiki/ISO_3166-1#Codes) ...
		cityName: 'Florianopolis',
		countryCode: 'br',
		// ... OR Coordinates (https://www.latlong.net/)
		lat: '-27.604510',
		lon: '-48.464163',
		// Update
		updateRegularly: true,
		updateTimeoutInSeconds: 600
	}

	useEffect( () =>
	{
		checkTheWeather();

		if ( options.updateRegularly )
			setTimeout( checkTheWeather, options.updateTimeoutInSeconds * 1000 );
	}, []);

	async function checkTheWeather()
	{
		let requestUrl = `https://api.openweathermap.org/data/2.5/weather?q=${ options.cityName },${ options.countryCode }&appid=${ options.apiKey }&units=${ options.unitType }`;
		if ( options.lat && options.lon )
			requestUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${ options.lat }&lon=${ options.lon }&appid=${ options.apiKey }&units=${ options.unitType }`;

		let data;
		try {
			const response = await fetch( requestUrl );
			if ( !response.ok )
			{
				console.error( `› Error fetching data. Check your options are correct.` );
				return;
			}

			data = await response.json();
			if ( !data )
			{
				console.error( `› Error interpreting data. Somethings really wrong.` );
				return;
			}
		}
		catch( _error: unknown )
		{
			console.error( `› Error fetching data. Not sure why, try again later` );
			return;
		}

		if ( !data.main?.temp || !data.weather?.[0]?.icon ) return;

		setWorked( true );
		setTemp( Math.round( data.main.temp ) );
		setClasses( 'w-' + data.weather[0].icon );

		// https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
		const img = `https://openweathermap.org/img/wn/${ data.weather[0].icon }@4x.png`;
		if ( img !== image )
			setImage( img );
	}
	
	if ( !worked ) return;

	return(
		<div id="weather">
			<div id="weather-image"><img src={ image } /></div>
			<div id="weather-temp" className={ classes }>{ temp }</div>
		</div>
	);
}

export default Weather;