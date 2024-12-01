/**
 * Alert Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import Alert from './Alert.tsx';
import { log } from '../../../shared/helpers.ts';
import type { WebSocketData } from '../../../shared/types.ts';

const Alerts = () =>
{
	const event = useEvent();
	const [currentAlert, setAlert] = useState<WebSocketData>();
	const [eventQueue, setEventQueue] = useState<WebSocketData[]>([]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);
	
	const events = new Map([
		[ 'rewardwrongscene', { 'noAudio': true } ],
		[ 'rewardtts', { 'noAudio': true } ]
	]);

	useEffect( () =>
	{
		if (
			!event?.detail?.type ||
			(
				!events.has( event.detail.type ) &&
				!event.detail?.extra?.titleAlert
			)
		) return;

		enqueueEvent( event.detail );
	},
	[ event ]);

	// Process event queue on state change
	useEffect( () => processEventQueue(),[ eventQueue, isAnimating, currentAlert ])

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
			setAlert();
			log( `timeout passed` );
		}, 10000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	};

	/** Enqueue event in waitlist
	 * 
	 * @param {WebSocketData} eventDetails All event details
	 */
	const enqueueEvent = ( eventDetails: WebSocketData ) =>
	{
		setEventQueue( (prevEvents: WebSocketData[]) => [...prevEvents, eventDetails] );
		log( eventDetails.type );
	};

	/** Process incoming events.
	 * 
	 * @param {WebSocketData} eventDetails All event details
	 */
	const processEvent = ( eventDetails: WebSocketData ) =>
	{
		setAlert( eventDetails );
		log( eventDetails.type );
	}

	/** Render current alert.
	 * 
	 * @param {Object} data 
	 * @param {Object} data 
	 * @returns {React.JSX.Element}
	 * @param {Object} data
	 * @returns {React.JSX.Element}
	 */
	const renderAlert = ( eventDetails: WebSocketData ) =>
	{
		return <Alert user={ eventDetails.user } profilePictureUrl={ eventDetails.profilePictureUrl } type={ eventDetails.type } title={ eventDetails.extra?.titleAlert ?? '' } count={ eventDetails.count ?? 0 } text={ eventDetails.text ?? '' } noAudio={ events.get( eventDetails.type )?.noAudio ?? false } color={ eventDetails.color } key={ eventDetails.key } />
	}

	if ( !currentAlert ) return;

	return(
		<section id="alerts">
			{ renderAlert( currentAlert ) }
		</section>
	);
}

export default Alerts;
