import {log} from '@shared/helpers.ts';
import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

const Weather = () =>
{
	const [searchParams] = useSearchParams();
	const [worked, setWorked] = useState(false);
	const [temp, setTemp] = useState('');
	const [icon, setIcon] = useState('');
	const [classes, setClasses] = useState('');

	useEffect(() =>
	{
		const city = searchParams.get('cityName') || '';
		const country = searchParams.get('countryCode') || '';
		const lat = searchParams.get('lat') || '';
		const lon = searchParams.get('lon') || '';

		checkTheWeather(city, country, lat, lon);
		const weatherInterval = setInterval(() => checkTheWeather(city, country, lat, lon), 600 * 1000);

		return () => clearInterval(weatherInterval);
	}, [searchParams]);

	async function checkTheWeather(cityName: string, countryCode: string, lat: string, lon: string)
	{
		const fetchOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				request: 'getWeather',
				data: {
					cityName,
					countryCode,
					lat,
					lon
				}
			})
		};

		try
		{
			let urlPrefix = 'https';
			if (process.env.BOT_URL.includes('localhost') || process.env.BOT_URL.includes('127.0.0.1'))
				urlPrefix = 'http';

			console.table(fetchOptions);

			const response = await fetch(`${urlPrefix}://${process.env.BOT_URL}/api`, fetchOptions);
			const data = await response.json();

			if (!data?.data?.temp) return;

			setWorked(true);
			// setTemp( Math.round(data.data.temp * 2) / 2 );
			setTemp(Math.round(data.data.temp));
			setClasses('w-' + data.data.icon);
			setIcon(data.data.iconUrl);

			// if ( data.data.iconUrl !== image )
		} catch (error: unknown)
		{
			log(error);
		}
	}

	if (!worked) return;

	return (
		<div id='weather'>
			<div id='weather-image'>
				<img src={icon}/>
			</div>
			<div id='weather-temp'
				className={classes}>{temp}</div>
		</div>
	);
};

export default Weather;
