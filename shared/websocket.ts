import EventEmitter from 'events';
import { clearTimer, log } from '@shared/helpers.ts';

export default class WebsocketController
{
	public pingInterval: number = 0;
	public ws: WebSocket | null = null;
	public websocketUrl: string;
	public websocketEvents: EventEmitter = new EventEmitter();
	private connectTimer: number = 0;

	constructor( botUrl: string )
	{
		const websocketPrefix =
			botUrl.includes( 'localhost' ) || botUrl.includes( '127.0.0.1' ) ?
			'ws':
			'wss';

		this.websocketUrl = `${websocketPrefix}://${botUrl}/websocket`;
	}

	connect()
	{
		try
		{
			this.ws = new WebSocket( this.websocketUrl );
			this.ws.addEventListener( 'open', this.onOpen );
			this.ws.addEventListener( 'close', this.onClose );
			this.ws.addEventListener( 'error', this.onError );
			this.ws.addEventListener( 'message', this.onMessage );
		}
		catch ( error: unknown ) { log( error ) }
	}

	disconnect()
	{
		if ( !this.ws ) return;
		if ( this.pingInterval ) clearInterval( this.pingInterval );
		this.connectTimer = clearTimer( this.connectTimer );

		this.ws.removeEventListener( 'open', this.onOpen );
		this.ws.removeEventListener( 'close', this.onClose );
		this.ws.removeEventListener( 'error', this.onError );
		this.ws.removeEventListener( 'message', this.onMessage );
		this.ws = null;
	}

	onOpen = ( _event: Event ) =>
	{
		log( '✅ Connected to propz-bot' );
		// Pings in regular intervals
		this.pingInterval = setInterval( () =>
		{
			if ( this.ws?.readyState === 1 )
				this.ws.send( '{"type":"ping"}' );
		}, 10000 );
	};

	onClose = ( event: CloseEvent ) =>
	{
		this.connectTimer = clearTimer( this.connectTimer );
		log( event.reason );
		this.disconnect();
		this.connectTimer = setTimeout( () => this.connect(), 5000 );
	};

	onError = ( event: Event ) =>
	{
		this.connectTimer = clearTimer( this.connectTimer );
		log( new Error( event.message ) );
		this.disconnect();
		this.connectTimer = setTimeout( () => this.connect(), 5000 );
	};

	onMessage = ( event: MessageEvent ) =>
	{
		try
		{
			const data = JSON.parse( event.data );
			this.websocketEvents.emit( 'message', { detail: data } );
		}
		catch ( error: unknown ) { log( error ) }
	};
}
