/**
 * Global event context
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import { createContext, useContext, useEffect, useState } from 'react';
import WebsocketController from '@propz/websocket.ts';
// import ObsController from '@propz/ObsController.ts';

const EventContext = createContext();

export const useEvent = () =>
{
	return useContext( EventContext );
}

export const EventProvider = ({ children }) =>
{
	const [event, setEvent] = useState( null );
	const websocketController = new WebsocketController( process.env.BOT_URL || '' );
	// const obsController = new ObsController();

	useEffect( () =>
	{
		websocketController.connect();
		//obsController.connect();

		const eventHandler = ( event: CustomEvent ) =>
		{
			if (
				!event?.detail?.type ||
				event?.detail?.type === 'pong'
			) return;
			
			console.table( event.detail );

			// if ( event?.detail?.obs )
			// 	obsController.sendCommands( event.detail.obs );

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