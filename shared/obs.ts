/**
 * OBS Websocket Controller
 * 
 * @author Wellington Estevo
 * @version 1.0.0
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
	}

	/** Connect to OBS Websocket. */
	async connect()
	{
		const obsUrl = process.env.OBS_WEBSOCKET_URL || '';
		const obsPort = process.env.OBS_WEBSOCKET_PORT || '';
		const obsPassword = process.env.OBS_WEBSOCKET_PASSWORD || '';

		if ( !obsUrl || !obsPort || !obsPassword )
		{
			log( 'Missing OBS credentials' );
			return;
		}

		try
		{
			await this.obs.connect( 'ws://' + obsUrl + ':' + obsPort, obsPassword );
			this.obs.on( 'ConnectionClosed', this.onConnectionClosed );
			log( 'OBS Connected' );
		}
		catch ( error: unknown )
		{
			log( error );
			setTimeout( () => this.connect(), 30000 );
		}
	}

	/** Send commands to OBS */
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

	onConnectionClosed = ( error: unknown ) =>
	{
		log( error );
		setTimeout( () => this.connect(), 30000 );
	}
}