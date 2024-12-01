/**
 * Websocket Controller
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import EventEmitter from 'events';
import { log } from './helpers.ts';

export default class WebsocketController
{
	public ws: WebSocket|null = null;
	public websocketUrl: string;
	public websocketEvents: EventEmitter = new EventEmitter();

	constructor( botUrl: string )
	{
		const websocketPrefix = botUrl.includes( 'localhost' ) ? 'ws' : 'wss';
		this.websocketUrl = `${websocketPrefix}://${botUrl}/websocket`;
	}

	connect()
	{
		try {
			this.ws = new WebSocket( this.websocketUrl );
			this.ws.addEventListener( 'open', this.onOpen );
			this.ws.addEventListener( 'close', this.onClose );
			this.ws.addEventListener( 'error', this.onError );
			this.ws.addEventListener( 'message', this.onMessage );
		}
		catch( error: unknown ) { log( error ) }
	}

	disconnect()
	{
		if ( !this.ws ) return;
		this.ws.removeEventListener( 'open', this.onOpen );
		this.ws.removeEventListener( 'close', this.onClose );
		this.ws.removeEventListener( 'error', this.onError );
		this.ws.removeEventListener( 'message', this.onMessage );
		this.ws = null;
	}

	onOpen = ( _event: Event ) =>
	{
		log( 'Connected to propz-bot' );
		// Pings in regular intervals
		setInterval( () =>
		{
			if ( this.ws?.readyState === 1 )
				this.ws.send( '{"type":"ping"}' );
		}, 10000 );
	}

	onClose = ( event: CloseEvent ) =>
	{
		log( event.reason );
		this.disconnect();
		setTimeout( () => this.connect(), 5000 );
	}

	onError = ( event: Event ) =>
	{
		log( new Error( `Websocket error: ${event.type}` ) );
		this.disconnect();
		setTimeout( () => this.connect(), 5000 );
	}
	
	onMessage = ( event: MessageEvent ) =>
	{
		try {
			const data = JSON.parse( event.data );
			this.websocketEvents.emit( 'message', { detail: data });
		}
		catch ( error: unknown ) { log( error ) }
	}
}