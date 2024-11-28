/**
 * Event Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import Event from './Event.tsx';

const Events = () =>
{
	const event = useEvent();
	const [events, setEvents] = useState([]);

	useEffect( () =>
	{
		if ( event )
		{
			if (
				!event?.detail?.type ||
				!event.detail?.extra?.titleEvent
			) return ( () => {} );

			processEvent( event.detail );
		}

		// Get initiale vents
		setInitialEvents();
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps
	

	/**
	 * Initialy fill events
	 * 
	 * @returns {void}
	 */
	const setInitialEvents = async () =>
	{
		const fetchOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify( { "request": "getEvents" } )
		};

		try {
			const response = await fetch( `https://${ Deno.env.get( 'BOT_BOT_URL' ) }/api`, fetchOptions );
			const data = await response.json();
	
			data.data.slice(-5).forEach( (event) =>
			{
				const eventDetails = {
					'key': crypto.randomUUID(),
					'type': event.eventType,
					'user': event.eventUsername,
					'count': event.eventCount,
					'extra': event.extra
				}
				processEvent( eventDetails );
			});
		}
		catch ( err )
		{
			console.error( `› EVENTS: setInitialEvents ›${ err.code ? ' (' + err.code + ')' : ' ›' } ${err.message}` );
		}
	}


	/**
	 * Process incoming events.
	 * 
	 * @param {Object} eventDetails All event details
	 */
	const processEvent = ( eventDetails ) =>
	{
		if ( !eventDetails || !eventDetails?.type ) return;

		const newEvent = <Event user={ eventDetails.user } key={ eventDetails.key } title={ eventDetails.extra.titleEvent ?? '' } count={ eventDetails.count || 0 } />;

		setEvents( (prevEvents) =>
		{
			let updatedEvents = [...prevEvents];
			updatedEvents.unshift( newEvent );

			if ( updatedEvents.length > 6 )
				updatedEvents.pop()
		
			return updatedEvents;
		});
	}

	return(
		<section id="events">
			{ events.map( (event, index) => ( event ) ) }
		</section>
	);
}

export default Events;