import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import Button from '@components/Button.tsx';

const Focus = () =>
{
	const event = useEvent();
	// Minutes
	const [ focusLength, setFocusLength ] = useState<number>( 0 );

	useEffect( () =>
	{
		if ( event?.detail?.type !== 'focusstart' ) return;
		const length = event.detail.count || 10;
		setFocusLength( length );
		setTimeout( () => setFocusLength( 0 ), length * 60 * 1000 );
	},
	[event]);

	if ( !focusLength ) return;

	return(
		<Button id="focus" style={ { '--animation-out-delay': `${focusLength * 60 - 2}s` } as React.CSSProperties }>
			Focus!
			<FocusTimer length={ focusLength } />
		</Button>
	)
}

export default Focus;

/** Focus timer countdown */
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

	return (
		<div id="focus-timer">{ minutes }:{ seconds.toLocaleString( 'de-DE', {minimumIntegerDigits: 2 } ) }</div>
	)
}
