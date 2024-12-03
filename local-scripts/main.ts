/**
 * The local workspace just controls my own printer for special events
 * 
 * @author Wellington Estevo
 * @version 1.0.9
 */

import WebsocketController from '@propz/websocket.ts';
import ObsController from './ObsController.ts';
import PrintController from './PrintController.ts';
import SpotifyAdMuter from './SpotifyAdMuter.ts';

const init = () =>
{
	const botUrl = Deno.env.get( 'BOT_URL' ) || '';
	const ws = new WebsocketController( botUrl );
	ws.connect();
	
	const obs = new ObsController();
	obs.connect();

	const spotify = new SpotifyAdMuter();
	spotify.start();

	const printController = new PrintController();

	ws.websocketEvents.on( 'message', async ( event: CustomEvent ) =>
	{
		if ( !event?.detail?.type ) return;

		if ( event?.detail?.obs )
			obs.sendCommands( event.detail.obs );

		await printController.print( event.detail );
	});
}

init();