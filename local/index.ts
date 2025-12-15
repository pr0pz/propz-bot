/**
 * The local workspace just controls my own printer for special events
 *
 * @author Wellington Estevo
 * @version 2.1.0
 */

// import ObsController from '@shared/obs.ts';
import WebsocketController from '@shared/websocket.ts';
import PrintController from './PrintController.ts';
// import SpotifyAdMuter from './SpotifyAdMuter.ts';

const init = () =>
{
	const botUrl = Deno.env.get( 'BOT_URL' ) || '';
	const ws = new WebsocketController( botUrl );
	ws.connect();
	Deno.addSignalListener( 'SIGINT', () => Deno.exit() );

	// const obs = new ObsController();
	// obs.connect();

	// Only works for mac
	// Only needed without premium
	// if ( Deno.build.os === 'darwin' )
	// {
	// 	const spotify = new SpotifyAdMuter();
	// 	spotify.start();
	// }

	// Only works for propz
	let printController = null;
	if ( botUrl.includes( 'propz.tv' ) )
		printController = new PrintController();

	ws.websocketEvents.on( 'message', async ( event: CustomEvent ) =>
	{
		if ( !event?.detail?.type ) return;

		// if ( event?.detail?.obs )
		// 	obs.sendCommands( event.detail.obs );

		if ( printController )
			await printController.print( event.detail );
	} );
};

init();
