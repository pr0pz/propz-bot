/**
 * LED Display Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '../../../shared/helpers.ts';

import type { WebSocketData } from '../../../shared/types.ts';

const LedDisplay = () =>
{
	const [currentEvent, setEvent] = useState<WebSocketData>();
	const [eventQueue, setEventQueue] = useState<WebSocketData[]>([]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	const event = useEvent();
	const events = new Set([ 'cheer', 'rewardtts' ]);

	useEffect( () =>
	{
		if ( event?.detail?.text === 'clear' )
		{
			setEvent();
			return;
		}
		
		if ( !events.has( event.detail.type ) ) return;
		enqueueEvent( event.detail );
	},
	[event]);

	useEffect( () => processEventQueue(), [ eventQueue, isAnimating, currentEvent ]);

	/** Process Event queue */
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
			log( `timeout passed` );
		}, 20000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	}

	/** Enqueue event in waitlist
	 * 
	 * @param {WebSocketData} eventDetails 
	 */
	const enqueueEvent = ( eventDetails: WebSocketData ) =>
	{
		setEventQueue( (prevEvents: WebSocketData[]) => [...prevEvents, eventDetails] );
		log( `enqueueEvent - ${ eventDetails.type }` );
	}

	/** Process incoming events.
	 * 
	 * @param {Object} eventDetails All event details
	 */
	const processEvent = ( eventDetails: WebSocketData ) =>
	{
		setEvent( eventDetails );
		log( `Message processed: ${ eventDetails.type }` );
	}

	/** Render current event.
	 * 
	 * @param {WebSocketData} eventDetails
	 */
	const renderEvent = ( eventDetails: WebSocketData ) =>
	{
		if ( !eventDetails ) return;
		const text = `${ eventDetails.user }: ${ eventDetails.text }`;
		// eslint-disable-next-line
		return <marquee scrollamount="20px" scrolldelay="120" style={{ color:eventDetails.color }}>{ text }</marquee>;
	}

	if ( !currentEvent ) return;

	return(
		<section id="leddisplay">
			{ renderEvent( currentEvent ) }
		</section>
	);
}

export default LedDisplay;