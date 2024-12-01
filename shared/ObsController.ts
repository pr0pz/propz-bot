/**
 * OBS Websocket Controller
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import OBSWebSocket from 'obs-websocket-js';
import { log } from './helpers.ts';
import type { ObsData } from './types.ts';

export default class ObsController
{
	public obs: OBSWebSocket;

	constructor()
	{
		this.obs = new OBSWebSocket();
		this.obs.on( 'ConnectionClosed', this.onConnectionClosed );
	}

	/** Connenct to OBS */
	async connect()
	{
		const obsUrl = process.env.OBS_WEBSOCKET_URL || '';
		const obsPort = process.env.OBS_WEBSOCKET_PORT || '';
		const obsPassword = process.env.OBS_WEBSOCKET_PASSWORD || '';
		// const obsUrl = Deno.env.get( 'OBS_WEBSOCKET_URL' ) || '';
		// const obsPort = Deno.env.get( 'OBS_WEBSOCKET_PORT' ) || '';
		// const obsPassword = Deno.env.get( 'OBS_WEBSOCKET_PASSWORD' ) || '';

		if ( !obsUrl || !obsPort || !obsPassword )
		{
			log( 'Missing OBS credentials' );
			return;
		}

		try
		{
			await this.obs.connect( 'ws://' + obsUrl + ':' + obsPort, obsPassword );
			log( 'OBS connected' );
		}
		catch ( _error: unknown ) { /* Don't do anything here, onConnectionClosed gets triggered */ }
	}

	/** Send command to OBS */
	async sendCommands( commands: ObsData|ObsData[] )
	{
		if ( !commands ) return;

		if ( !Array.isArray( commands ) )
			commands = [ commands ];

		// Array with all requests for logging purposes only
		const requestsToSend: string[] = [];
		for ( const command of commands )
			requestsToSend.push( command.requestType );

		// Try send command
		try
		{
			await this.obs.callBatch( commands );
			log( `<${ requestsToSend.join( ', ') }>` );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Fire on connection close */
	onConnectionClosed = ( _error: unknown ) =>
	{
		log( new Error( 'OBS connection closed. Reconnecting in 30s' ) );
		setTimeout( () => this.connect(), 30000 );
	}
}