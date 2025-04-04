/**
 * The local workspace just controls my own printer for special events
 *
 * @author Wellington Estevo
 * @version 1.6.4
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

	// Only works for mac
	if ( Deno.build.os === 'darwin' )
	{
		const spotify = new SpotifyAdMuter();
		spotify.start();
	}

	// Only works for propz
	let printController = null;
	if ( botUrl.includes( 'propz.tv' ) )
		printController = new PrintController();

	ws.websocketEvents.on( 'message', async ( event: CustomEvent ) =>
	{
		if ( !event?.detail?.type ) return;

		if ( event?.detail?.obs )
			obs.sendCommands( event.detail.obs );

		if ( printController )
			await printController.print( event.detail );
	} );
};

init();
