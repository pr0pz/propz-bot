/**
 * The local workspace just controls my own printer for special events
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import WebsocketController from '@propz/websocket.ts';
import PrintController from './PrintController.ts';

const init = () =>
{
	const ws = new WebsocketController();
	ws.connect();

	const printController = new PrintController();

	ws.websocketEvents.on( 'message', async ( event ) =>
	{
		if ( !event?.detail?.type ) return;
		await printController.print( event.detail );
	});
}

init();