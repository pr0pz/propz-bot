/**
 * Global event context
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import ObsController from '@shared/obs.ts';
import WebsocketController from '@shared/websocket.ts';
import { createContext, useContext, useEffect, useState } from 'react';

const EventContext = createContext();

export const useEvent = () =>
{
	return useContext( EventContext );
};

export const EventProvider = ( { children } ) =>
{
	const [ event, setEvent ] = useState( null );
	const websocketController = new WebsocketController( process.env.BOT_URL || '' );
	const obsController = new ObsController( process.env.OBS_WEBSOCKET_PASSWORD || '' );

	useEffect( () =>
	{
		websocketController.connect();
		obsController.connect();

		const eventHandler = ( event: CustomEvent ) =>
		{
			if (
				!event?.detail?.type ||
				event?.detail?.type === 'pong'
			) return;

			console.table( event.detail );

			if ( event?.detail?.obs )
				obsController.sendCommands( event.detail.obs );

			setEvent( event );
		};
		websocketController.websocketEvents.on( 'message', eventHandler );

		return () =>
		{
			websocketController.websocketEvents.off( 'message', eventHandler );
			websocketController.disconnect();
			obsController.disconnect();
		};
	}, [] );

	return (
		<EventContext.Provider value={event}>
			{children}
		</EventContext.Provider>
	);
};
