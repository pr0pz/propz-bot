/**
 * Focus Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.6
 */

import { useEffect, useState } from "react";
import { useEvent } from '../EventContext.tsx';

const Focus = () =>
{
	const event = useEvent();
	const [ focusLength, setFocusLength ] = useState<number>( 0 );

	useEffect( () =>
	{
		if (
			!event ||
			event.detail.type !== 'focusstart'
		) return;

		// Minutes
		setFocusLength( event.detail.count );
		const timeOutLength = event.detail.count * 60 * 1000;

		setTimeout( () => 
		{
			setFocusLength( 0 );
		}, timeOutLength );
	},
	[event]);

	if ( !focusLength ) return;

	return(
		<div id="focus" className="radius border shadow" style={{ animationDuration: `${ focusLength * 60 }s` }}>
			<div id="focus-inner">
				<div>Focus!</div>
				<FocusTimer length={ focusLength } />
			</div>
		</div>
	)
}

export default Focus;

/**
 * Pretime (time passed)
 * 
 * @param {object} props 
 * @returns 
 */
const FocusTimer = ( propz: { length: number } ) =>
{
	const [minutes, setMinutes] = useState<number>( Math.floor( propz.length ) );
	const [seconds, setSeconds] = useState<number>( 0 );

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
		<div id="focus-timer">{ minutes }:{ seconds.toLocaleString( 'de-DE', {minimumIntegerDigits: 2 } ) }</div>
	)
}