/**
 * Weather
 * 
 * @author Wellington Estevo
 * @version 1.2.2
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const Weather = () =>
{
	const [searchParams] = useSearchParams();
	const [cityName, setCityName] = useState( '' );
	const [countryCode, setCountryCode] = useState( '' );
	const [worked, setWorked] = useState( false );
	const [temp, setTemp] = useState( '' );
	const [icon, setIcon] = useState( '' );
	const [classes, setClasses] = useState( '' );

	useEffect( () =>
	{
		setCityName( searchParams.get('cityName') || '' );
		setCountryCode( searchParams.get('countryCode') || '');

		if ( !cityName || !countryCode ) return;

		checkTheWeather();
		const weatherInterval = setInterval( checkTheWeather, 600 * 1000 );

		return () => clearInterval( weatherInterval );
	}, []);

	async function checkTheWeather()
	{
		const fetchOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				request: "getWeather", 
				data: { 
					cityName, 
					countryCode 
				} 
			})
		};

		try {
			const response = await fetch( `https://${ process.env.BOT_URL }/api`, fetchOptions );
			const data = await response.json();

			if ( !data?.data?.temp ) return;

			setWorked( true );
			//setTemp( Math.round(data.data.temp * 2) / 2 );
			setTemp( Math.round(data.data.temp) );
			setClasses( 'w-' + data.data.icon );
			setIcon( data.data.iconUrl );

			//if ( data.data.iconUrl !== image )
		}
		catch ( error: unknown ) { console.log( error ) }
	}
	
	if ( !worked ) return;

	return(
		<div id="weather">
			<div id="weather-image"><img src={ icon } /></div>
			<div id="weather-temp" className={ classes }>{ temp }</div>
		</div>
	);
}

export default Weather;