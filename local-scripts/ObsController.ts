/**
 * OBS Websocket Controller
 * 
 * @author Wellington Estevo
 * @version 1.0.9
 */

import OBSWebSocket from 'obs-websocket-js';
import { log } from '@propz/helpers.ts';
import type { ObsData } from '@propz/types.ts';

export default class ObsController
{
	public obs: OBSWebSocket;
	private obsUrl = 'ws://localhost:4455'
	private obsPassword = '';

	constructor()
	{
		this.obs = new OBSWebSocket();
		this.obs.on( 'ConnectionClosed', this.onConnectionClosed );
		this.obsPassword = Deno.env.get( 'OBS_WEBSOCKET_PASSWORD' ) || '';
	}

	async connect()
	{
		try
		{
			await this.obs.connect( this.obsUrl, this.obsPassword );
			log( 'OBS connected' );
		}
		catch ( _error: unknown ) { /* Don't do anything here, onConnectionClosed gets triggered */ }
	}

	async sendCommands( commands: ObsData|ObsData[] )
	{
		if ( !commands ) return;
		if ( !Array.isArray( commands ) )
			commands = [ commands ];

		// Array with all requests for logging purposes only
		const requestsToSend: string[] = [];
		for ( const command of commands )
			requestsToSend.push( command.requestType );

		try
		{
			await this.obs.callBatch( commands );
			log( `<${ requestsToSend.join( ', ') }>` );
		}
		catch ( error: unknown ) { log( error ) }
	}

	onConnectionClosed = ( _error: unknown ) =>
	{
		log( new Error( 'No OBS connection. Reconnecting in 30s' ) );
		setTimeout( () => this.connect(), 30000 );
	}
}