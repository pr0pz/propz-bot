/**
 * Event Manager
 * 
 * @author Wellington Estevo
 * @version 1.5.8
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import Event from './Event.tsx';
import { log } from '@propz/helpers.ts';

import type { TwitchEventData, WebSocketData } from '@propz/types.ts';

const Events = () =>
{
	const event = useEvent();
	const [events, setEvents] = useState<typeof Event[]>([]);

	useEffect( () => { setInitialEvents() }, [] );
	useEffect( () =>
	{
		if ( event?.detail )
			processEvent( event.detail )
	},
	[event] );
	
	/** Initialy fill events */
	const setInitialEvents = async () =>
	{
		let urlPrefix = 'https';
		if ( process.env.BOT_URL.includes( 'localhost' ) || process.env.BOT_URL.includes( '127.0.0.1' ) )
			urlPrefix = 'http';

		const fetchOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: '{ "request": "getLastEvents" }'
		};

		try {
			const response = await fetch( `${urlPrefix}://${ process.env.BOT_URL }/api`, fetchOptions );
			const data = await response.json();
	
			data.data.slice(0,5).reverse().forEach( (event: TwitchEventData) =>
			{
				const eventDetails: WebSocketData = {
					'key': crypto.randomUUID(),
					'type': event.type,
					'user': event.name || '',
					'text': '',
					'count': event.count || 0,
					'color': '',
					'extra': event.extra,
					'saveEvent': true
				}
				processEvent( eventDetails );
			});
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Process incoming events.
	 * 
	 * @param {WebSocketData} eventDetails All event details
	 */
	const processEvent = ( eventDetails: WebSocketData ) =>
	{
		if (
			!eventDetails ||
			!eventDetails.type ||
			!eventDetails.saveEvent ||
			!eventDetails.extra?.titleEvent
		) return;

		const newEvent = <Event type={ eventDetails.type } user={ eventDetails.user } key={ eventDetails.key } title={ eventDetails.extra!.titleEvent ?? '' } count={ eventDetails.count || 0 } />;

		setEvents( ( prevEvents: typeof Event[] ) =>
		{
			const updatedEvents = [...prevEvents];
			updatedEvents.unshift( newEvent );

			if ( updatedEvents.length > 6 )
				updatedEvents.pop()
		
			return updatedEvents;
		});
	}

	return(
		<section id="events">
			{ events.map( (event: Event, _index: number) => ( event ) ) }
		</section>
	);
}

export default Events;