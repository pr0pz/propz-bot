/**
 * Global event context
 * 
 * @author Wellington Estevo
 * @version 1.0.2
 */

import { createContext, useContext, useEffect, useState } from 'react';
import WebsocketController from '../../shared/websocket.ts';
import ObsController from '../../shared/ObsController.ts';

const EventContext = createContext();

export const useEvent = () =>
{
	return useContext( EventContext );
}

export const EventProvider = ({ children }) =>
{
	const [event, setEvent] = useState( null );
	const websocketController = new WebsocketController();
	const obsController = new ObsController();

	useEffect( () =>
	{
		// Build websocket connection
		websocketController.connect();
		obsController.connect();

		const eventHandler = ( event ) =>
		{
			if ( !event?.detail?.type ) return;
			event.detail.key = crypto.randomUUID();

			if ( event?.details?.obs )
				obsController.sendCommands( event.details.obs );

			setEvent( event );
		}
		websocketController.websocketEvents.on( 'message', eventHandler );
	},
	[]);

	return (
		<EventContext.Provider value={ event }>
			{ children }
		</EventContext.Provider>
	);
};