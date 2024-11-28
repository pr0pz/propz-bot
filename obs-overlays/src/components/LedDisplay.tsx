/**
 * LED Display Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';

const LedDisplay = () =>
{
	const [currentEvent, setEvent] = useState();
	const [eventQueue, setEventQueue] = useState([]);
	const [isAnimating, setIsAnimating] = useState(false);

	const event = useEvent();
	const events = [ 'cheer', 'rewardtts' ];

	useEffect( () =>
	{
		if ( !event ) return;

		if (
			event.detail?.text &&
			event.detail.text === '!clear'
		)
		{
			setEvent();
			return ( () => {} );
		}
		
		if (
			!event.detail?.type ||
			!events.includes( event.detail.type )
		) return ( () => {} );

		enqueueEvent( event.detail );
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps

	// Handling event queue
	useEffect( () =>
	{
		processEventQueue();
	},
	[ eventQueue, isAnimating, currentEvent ]) // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Process Event queue.
	 * 
	 * @returns {void}
	 */
	const processEventQueue = async () =>
	{
		// Wait for animation to end
		if ( isAnimating || eventQueue.length === 0 ) return;

		const nextEvent = eventQueue[0];

		console.log( `%c› LEDDISPLAY: processing event - ${ nextEvent.type }`, process.env.CONSOLE_SUCCESS );

		// Trigger animation
		setIsAnimating( true );
		// Process Event
		processEvent( nextEvent );
		// Simulate some delay for the animation
		// Timeout könnte optional sein, abhängig von der gewünschten Logik
		setTimeout( () =>
		{
			setEventQueue( (eventQueue) => eventQueue.slice(1) );
			setIsAnimating( false );
			// ??
			// Remove to test
			setEvent();
			console.log( `%c› LEDDISPLAY: timeout passed`, process.env.CONSOLE_SUCCESS );
		}, 20000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	};

	/**
	 * Enqueue event in waitlist
	 * 
	 * @param {Object} event 
	 */
	const enqueueEvent = ( eventDetails ) => {
		setEventQueue( prevEvents => [...prevEvents, eventDetails] );
		console.log( `%c› LEDDISPLAY: enqueueEvent - ${ eventDetails.type }`, process.env.CONSOLE_SUCCESS );
	};

	/**
	 * Process incoming events.
	 * 
	 * eventDetails {
		color: '#ffff00'
		count: 9
		key: '998c075d-df99-4eaa-9b62-117507b1be2a'
		profilePictureUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/17cfddab-98e3-4a74-ae9e-366ededf0c8e-profile_image-300x300.png'
		text: ''
		type: 'raid'
		user: 'PropzMaster'
	}
	 * 
	 * @param {Object} eventDetails All event details
	 */
	const processEvent = ( eventDetails ) =>
	{
		if ( !eventDetails || !eventDetails?.type ) return;

		if ( events.includes( eventDetails.type ) )
		{
			setEvent( eventDetails );
			console.log( `%c› LEDDISPLAY: Message processed: ${ eventDetails.type }`, process.env.CONSOLE_SUCCESS );
		}
		else
		{
			setEvent();
		}
	}

	/**
	 * Render current event.
	 * 
	 * @param {Object} data 
	 * @returns {React.JSX.Element}
	 */
	const renderEvent = ( data ) =>
	{
		if ( !data ) return;
		const text = `${ data.user }: ${ data.text }`;
		// eslint-disable-next-line
		return <marquee scrollamount="20px" scrolldelay="120" style={{ color:data.color }}>{ text }</marquee>;
	}

	if ( !currentEvent ) return;

	return(
		<section id="leddisplay">
			{ renderEvent( currentEvent ) }
		</section>
	);
}

export default LedDisplay;