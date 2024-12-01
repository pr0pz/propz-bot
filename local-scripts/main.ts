/**
 * The local workspace just controls my own printer for special events
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import WebsocketController from '@propz/websocket.ts';
import ObsController from '../shared/ObsController.ts';
import PrintController from './PrintController.ts';

const init = () =>
{
	const botUrl = Deno.env.get( 'BOT_URL' ) || '';
	const ws = new WebsocketController( botUrl );
	ws.connect();
	
	const obs = new ObsController();
	obs.connect();

	const printController = new PrintController();

	ws.websocketEvents.on( 'message', async ( event ) =>
	{
		if ( !event?.detail?.type ) return;

		if ( event?.details?.obs )
			obs.sendCommands( event.details.obs );

		await printController.print( event.detail );
	});
}

init();