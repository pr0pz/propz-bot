/**
 * LED Display Manager
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import { log } from '@shared/helpers.ts';

import type { WebSocketData } from '@shared/types.ts';

const LedDisplay = () =>
{
	const [currentEvent, setEvent] = useState<WebSocketData>();
	const [eventQueue, setEventQueue] = useState<WebSocketData[]>([]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	const event: CustomEvent = useEvent();
	const events = new Set([ 'cheer', 'rewardtts' ]);

	useEffect( () =>
	{
		if ( !event ) return;
		if ( event.detail?.text === 'clear' )
		{
			setEvent();
			return;
		}

		if ( !events.has( event.detail.type ) ) return;
		enqueueEvent( event.detail );
	},
	[event]);

	useEffect( () => processEventQueue(), [ eventQueue, isAnimating, currentEvent ]);

	const processEventQueue = () =>
	{
		// Wait for animation to end
		if ( isAnimating || eventQueue.length === 0 ) return;

		const nextEvent = eventQueue[0];
		log( nextEvent.type );

		// Trigger animation
		setIsAnimating( true );
		// Process Event
		processEvent( nextEvent );
		// Simulate some delay for the animation
		// Timeout könnte optional sein, abhängig von der gewünschten Logik
		setTimeout( () =>
		{
			setEventQueue( (eventQueue: WebSocketData[]) => eventQueue.slice(1) );
			setIsAnimating( false );
			// ??
			// Remove to test
			setEvent();
			log( `event processed` );
		}, 20000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	}

	const enqueueEvent = ( eventDetails: WebSocketData ) => setEventQueue( ( prevEvents: WebSocketData[] ) => [...prevEvents, eventDetails] );

	const processEvent = ( eventDetails: WebSocketData ) => setEvent( eventDetails );

	/** Render current event.
	 *
	 * @param {WebSocketData} eventDetails
	 */
	const renderEvent = ( eventDetails: WebSocketData ) =>
	{
		if ( !eventDetails ) return;
		const text = `${ eventDetails.user }: ${ eventDetails.text }`;
		return <marquee id="led" scrollamount="20px" scrolldelay="120" style={{ color:eventDetails.color }}>{ text }</marquee>;
	}

	if ( !currentEvent ) return;

	return(
		<section id="leddisplay">
			{ renderEvent( currentEvent ) }
		</section>
	);
}

export default LedDisplay;
