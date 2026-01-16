import { useEffect, useState } from 'react';

const Obs = () =>
{
	const [functions, setFunctions] = useState([]);

	useEffect(() =>
	{
		if ( globalThis.obsstudio )
		{
			const methods = Object.keys( globalThis.obsstudio ).filter(
				(key) => typeof globalThis.obsstudio[key] === 'function'
			);
			setFunctions(methods);
		}
	},
	[]);

	return(
		<section>
			<h1>OBS Studio Funktionen</h1>
			{functions.length > 0 ? (
				<ul>
					{functions.map((func, index) => (
						<li key={index}>{func}</li>
					))}
				</ul>
			) : (
				<p>Keine Funktionen gefunden oder OBS Studio ist nicht verfügbar.</p>
			)}
		</section>
	);
}

export default Obs;
