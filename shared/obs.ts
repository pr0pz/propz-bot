/**
 * OBS Websocket Controller
 *
 * @author Wellington Estevo
 * @version 1.6.10
 */

import { log } from '@propz/helpers.ts';
import type { ObsData } from '@propz/types.ts';
import OBSWebSocket from 'obs-websocket-js';

export default class ObsController
{
	public obs: OBSWebSocket;
	private obsUrl = 'ws://localhost:4455';

	constructor( private obsPassword: string )
	{
		this.obs = new OBSWebSocket();
		this.obs.on( 'ConnectionClosed', this.onConnectionClosed );
	}

	async connect()
	{
		try
		{
			await this.obs.connect( this.obsUrl, this.obsPassword );
			log( 'OBS connected' );
		}
		catch ( _error: unknown )
		{
			/* Don't do anything here, onConnectionClosed gets triggered */
		}
	}

	async disconnect()
	{
		try
		{
			await this.obs.disconnect();
			log( 'OBS disconnected' );
		}
		catch ( _error: unknown )
		{
			/* Don't do anything here, onConnectionClosed gets triggered */
		}
	}

	async sendCommands( commands: ObsData | ObsData[] )
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
			log( `<${requestsToSend.join( ', ' )}>` );
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	onConnectionClosed = ( _error: unknown ) =>
	{
		log( new Error( 'No OBS connection. Reconnecting in 30s' ) );
		setTimeout( () => this.connect(), 30000 );
	};
}
