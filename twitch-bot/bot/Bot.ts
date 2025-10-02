/**
 * Bot
 *
 * @author Wellington Estevo
 * @version 1.7.18
 */

import '@propz/prototypes.ts';
import { log } from '@propz/helpers.ts';

import type { ApiRequest, ApiResponse, KofiData } from '@propz/types.ts';
import type { Discord } from '../discord/Discord.ts';
import type { Twitch } from '../twitch/Twitch.ts';
import type { BotWebsocket } from './BotWebsocket.ts';

export class Bot
{
	private server!: Deno.HttpServer;

	constructor(
		private discord: Discord,
		private twitch: Twitch,
		private ws: BotWebsocket
	)
	{
		this.handleExit();
	}

	/** Main function */
	run()
	{
		this.server = Deno.serve(
			{ port: 1337, hostname: '127.0.0.1' },
			this.handleServerRequests
		);
		void this.discord.connect();
		void this.twitch.init();
	}

	/** Handle all incoming server requests
	 *
	 * @param {Request} req Incoming request
	 */
	handleServerRequests = async ( req: Request ): Promise<Response> =>
	{
		// CORS Preflight-Request (OPTIONS)
		if (
			!req ||
			req.method === 'OPTIONS' ||
			req.method === 'HEAD'
		)
		{
			return new Response( null, {
				status: 204,
				headers: {
					'access-control-allow-origin': '*',
					'access-control-allow-methods': 'GET, POST, OPTIONS, HEAD',
					'access-control-allow-headers': 'Content-Type, Authorization'
				}
			} );
		}

		const path = req.url.match( /(\/\w+)$/i )?.[ 0 ];
		switch ( path )
		{
			case '/websocket':
				return this.handleWebsocket( req );

			case '/api':
				return await this.handleApi( req );

			case '/webhook':
				return await this.handleWebhook( req );

			default:
				return new Response( null, { status: 204 } );
		}
	};

	/** Handle Websocket connections
	 *
	 * @param {Request} req Incoming request
	 */
	private handleWebsocket( req: Request ): Response
	{
		if ( req.headers.get( 'upgrade' ) !== 'websocket' )
			return new Response( null, { status: 400 } );

		const { socket, response } = Deno.upgradeWebSocket( req );
		const wsId: string = crypto.randomUUID();

		const errorHandler = ( event: Event ) =>
		{
			log( event );
			this.ws.wsConnections.delete( wsId );

			socket.removeEventListener( 'error', errorHandler );
			socket.removeEventListener( 'message', messageHandler );
			socket.removeEventListener( 'open', openHandler );
			socket.removeEventListener( 'close', closeHandler );
			socket.close();
		};
		const messageHandler = () => socket.send( '{"type":"pong"}' );
		const openHandler = () =>
		{
			log( `WS client connected › ${ wsId }` );
			this.ws.wsConnections.set( wsId, socket );
		};
		const closeHandler = () =>
		{
			log( `WS client disconnected › ${ wsId }` );
			this.ws.wsConnections.delete( wsId );

			socket.removeEventListener( 'error', errorHandler );
			socket.removeEventListener( 'message', messageHandler );
			socket.removeEventListener( 'open', openHandler );
			socket.removeEventListener( 'close', closeHandler );
			socket.close();
		};

		socket.addEventListener( 'error', errorHandler );
		socket.addEventListener( 'message', messageHandler );
		socket.addEventListener( 'open', openHandler );
		socket.addEventListener( 'close', closeHandler );

		return response;
	}

	/** Handle Webhook calls
	 *
	 * @param {Request} req Incoming request
	 */
	private async handleWebhook( req: Request ): Promise<Response>
	{
		try
		{
			if ( req.headers.get( 'x-github-event' ) )
			{
				const body = await req.json();
				const eventName = req.headers.get( 'x-github-event' ) || 'github';
				this.discord.handleGithubEvent( eventName, body );
			}

			if ( req.headers.get( 'x-propz-event' ) )
			{
				const body = await req.json();
				void this.twitch.processEvent({
					eventType: body.eventType.toString().toLowerCase() || 'propz.de',
					user: await this.twitch.data.getUser(),
				})
			}

			// body = x-www-form-urlencoded
			if ( req.headers.get( 'user-agent' ) === 'Kofi.Webhooks' )
			{
				const body = await req.text();
				const kofiData: KofiData = JSON.parse(
					decodeURIComponent( body.replace( /^data=/, '' ) )
				);
				this.twitch.handleKofiEvent( kofiData );
			}
		}
		catch ( error: unknown )
		{
			log( error );
			return new Response( null, { status: 400 } );
		}

		return new Response( null, { status: 204 } );
	}

	/** Handle API calls
	 *
	 * @param {Request} req Incoming Request
	 */
	private async handleApi( req: Request ): Promise<Response>
	{
		let body: ApiRequest;
		let response: ApiResponse = { data: 'Your JSON sucks' };
		try
		{
			body = await req.json();
			if ( body.request !== 'isStreamActive' )
				log( body.request );
		}
		catch ( error: unknown )
		{
			log( error );
			return new Response( JSON.stringify( response ), { status: 400 } );
		}

		response = await this.twitch.processApiCall( body );
		const statusCode = typeof response.data !== 'undefined' ? 200 : 400;

		return new Response(
			JSON.stringify( response ),
			{
				status: statusCode,
				headers: {
					'content-type': 'application/json',
					'access-control-allow-origin': '*',
					'access-control-allow-methods': 'GET, POST, OPTIONS',
					'access-control-allow-headers': 'Content-Type, Authorization'
				}
			}
		);
	}

	/** Disconnect and kill everything on quit */
	private handleExit()
	{
		Deno.addSignalListener( 'SIGINT', async () =>
		{
			await this.server.shutdown();

			if ( this.twitch.chat.chatClient )
				this.twitch.chat.chatClient.quit();

			if ( this.twitch.events.listener )
				this.twitch.events.listener.stop();

			if ( this.discord.client )
				await this.discord.client.destroy();

			if ( this.twitch.data.db )
			{
				this.twitch.data.db.cleanupDatabase();
				this.twitch.data.db.close();
			}

			log( 'SIGINT Shutdown 🔻' );

			Deno.exit();
		} );
	}
}
