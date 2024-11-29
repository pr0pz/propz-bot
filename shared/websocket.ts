/**
 * Websocket Controller
 * 
 * @author Wellington Estevo
 * @version 1.0.2
 */

import EventEmitter from 'events';
import { log } from './helpers.ts';

export default class WebsocketController
{
	public ws: WebSocket|null = null;
	public websocketUrl: string;
	public websocketEvents: EventEmitter = new EventEmitter();

	constructor()
	{
		const botUrl = process.env.BOT_URL || '';
		const websocketPrefix = botUrl.includes( 'localhost' ) ? 'ws' : 'wss';
		this.websocketUrl = `${websocketPrefix}://${botUrl}/websocket`;
	}

	connect()
	{
		try {
			this.ws = new WebSocket( this.websocketUrl );
			this.ws.addEventListener( 'open', this.onOpen );
			this.ws.addEventListener( 'close', this.onCloseOrError );
			this.ws.addEventListener( 'error', this.onCloseOrError );
			this.ws.addEventListener( 'message', this.onMessage );
		}
		catch( error: unknown ) { log( error ) }
	}

	disconnect()
	{
		if ( !this.ws ) return;
		this.ws.removeEventListener( 'open', this.onOpen );
		this.ws.removeEventListener( 'close', this.onCloseOrError );
		this.ws.removeEventListener( 'error', this.onCloseOrError );
		this.ws.removeEventListener( 'message', this.onMessage );
		this.ws = null;
	}

	onOpen = () =>
	{
		log( 'Connected to propz-bot' );
		// Pings in regular intervals
		setInterval( () =>
		{
			if ( this.ws?.readyState === 1 )
				this.ws.send( '{"type":"ping"}' );
		}, 10000 );
	}

	onCloseOrError = ( event: unknown ) =>
	{
		log( event );
		this.disconnect();
		setTimeout( () => this.connect(), 5000 );
	}

	onMessage = ( event: unknown ) =>
	{
		let data = null;
		if ( !event || !('data' in event) ) return;

		try { data = JSON.parse( event.data ); }
		catch ( error: unknown ) { log( error ); return; }

		this.websocketEvents.emit( 'message', { detail: data });
	}
}