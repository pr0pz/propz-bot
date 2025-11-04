/**
 * AdBreakBox
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import Window from '@components/Window.tsx';

const AdBreakBox = () =>
{
	const event = useEvent();
	const [ adBreakLength, setAdBreakLength ] = useState<number>( 0 );
	const [ adTitle, setAdTitle ] = useState( 'WERBUNG' );

	useEffect( () =>
	{
		if ( event?.detail?.type !== 'adbreak' ) return;

		const length = parseInt( event.detail.count ) || 180;
		setAdBreakLength( length );
		setAdTitle( event.detail.extra.titleEvent || 'WERBUNG' );
		setTimeout( () => setAdBreakLength(0), length * 1000 );
	},
	[event]);

	if ( !adBreakLength ) return;

	return(
		<Window id="ad-break-box">
			<div id="ad-break-inner">{ adTitle } <AdBreakTimer length={ adBreakLength } /></div>
			<div id="ad-break-inner-bg" className="gradient-green" style={{ animationDuration: `${ adBreakLength }s` }}></div>
		</Window>
	)
}
export default AdBreakBox;

/** The countdown timer */
const AdBreakTimer = ( propz: { length: number } ) =>
{
	const [minutes, setMinutes] = useState<number>( Math.floor( propz.length / 60 ) );
	const [seconds, setSeconds] = useState<number>( Math.floor( propz.length % 60 ) );

	useEffect(() =>
	{
		const countdown = setInterval(() =>
		{
			// Decrease time by 1 second
			if ( seconds > 0 )
			{
				setSeconds( seconds - 1 );
			}
			else
			{
				if ( minutes > 0 )
				{
					setMinutes( minutes - 1 );
					setSeconds( 59 );
				}
				else
				{
					clearInterval( countdown ); // Stop the interval when time is up
				}
			}

		}, 1000 );

		return () => clearInterval( countdown );
	}, [ minutes, seconds ]);

	return (
		<span id="ad-break-timer">({ minutes }:{ seconds.toLocaleString( 'de-DE', {minimumIntegerDigits: 2 } ) })</span>
	)
}
