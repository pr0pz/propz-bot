/**
 * AdBreakBanner
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import { useEffect, useState } from "react";
import { useEvent } from '../EventContext.tsx';

const AdBreakBox = () =>
{
	const event = useEvent();
	const [ adBreakLength, setAdBreakLength ] = useState( 0 );

	useEffect( () =>
	{
		if (
			!event ||
			!event.detail?.type ||
			!event.detail.count ||
			event.detail.type !== 'adbreak'
		) return ( () => {} );

		setAdBreakLength( event.detail.count );
		const timeOutLength = event.detail.count * 1000;

		setTimeout( () => 
		{
			setAdBreakLength( 0 );
		}, timeOutLength );
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps

	if ( !adBreakLength ) return;

	return(
		<div id="ad-break-box" className="browser radius-big border shadow" style={{ animationDuration: `${ adBreakLength }s` }}>
			<div className="browser-header">
				<div className="browser-header-buttons">
					<span className="browser-button red"></span>
					<span className="browser-button yellow"></span>
					<span className="browser-button"></span>
				</div>
			</div>
			<div className="browser-body">
				<div id="ad-break-inner">
					Werbungsblub <AdBreakTimer length={ adBreakLength } />
				</div>
				<div id="ad-break-inner-bg" className="gradient-green" style={{ animationDuration: `${ adBreakLength }s` }}></div>
			</div>
		</div>
	)
}
export default AdBreakBox;

/**
 * Pretime (time passed)
 * 
 * @param {object} props 
 * @returns 
 */
const AdBreakTimer = ( propz ) =>
{
	const [minutes, setMinutes] = useState( Math.floor( propz.length / 60 ) );
	const [seconds, setSeconds] = useState( Math.floor( propz.length % 60 ) );

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

/*	==========
	Render
	========== */

	return (
		<span id="ad-break-timer">({ minutes }:{ seconds.toLocaleString( 'de-DE', {minimumIntegerDigits: 2 } ) })</span>
	)
}