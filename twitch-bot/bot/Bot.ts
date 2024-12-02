/**
 * Bot
 * 
 * @author Wellington Estevo
 * @version 1.0.8
 */

import '@propz/prototypes.ts';
import { log } from '@propz/helpers.ts';

import type { Discord } from '../discord/Discord.ts';
import type { Twitch } from '../twitch/Twitch.ts';
import type { BotWebsocket } from './BotWebsocket.ts';
import type { ApiRequest, ApiResponse, KofiData } from '@propz/types.ts';

export class Bot
{
	private server!: Deno.HttpServer;
	private discord: Discord;
	private twitch: Twitch;
	private ws: BotWebsocket;

	constructor( discord: Discord, twitch: Twitch, ws: BotWebsocket )
	{
		this.discord = discord;
		this.twitch = twitch;
		this.ws = ws;
		this.handleExit();
	}

	/** Main function */
	run()
	{
		this.server = Deno.serve( { port: 1337, hostname: '127.0.0.1' }, this.handleServerRequests );
		this.discord.connect();
		this.twitch.init();
	}

	/** Handle all incoming server requests
	 * 
	 * @param {Request} req Incoming request
	 */
	handleServerRequests = async ( req: Request ): Promise<Response> =>
	{
		// CORS Preflight-Request (OPTIONS)
		if ( !req || req.method === 'OPTIONS' )
			return new Response( null, { status: 204 });

		const url = new URL( req.url );

		if ( url.pathname.startsWith( '/websocket' ) )
		{
			return this.handleWebsocket( req );
		}
		else if ( url.pathname.startsWith( '/api' ) )
		{
			return await this.handleApi( req );
		}
		else if ( url.pathname.startsWith( '/webhook' ) )
		{
			return await this.handleWebhook( req );
		}

		return new Response( 'propz', { status: 200 } );
	}

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

		//socket.addEventListener( 'error', (event) => log( event ) );
		socket.addEventListener( 'message', () => socket.send( '{"type":"pong"}' ) );

		socket.addEventListener( 'open', () =>
		{
			log( `WebSocket client connected › ${wsId}` );
			this.ws.wsConnections.set( wsId, socket );
		});

		socket.addEventListener( 'close', () =>
		{
			log( `WebSocket client disconnected › ${wsId}` );
			this.ws.wsConnections.delete( wsId );
		});

		return response;
	}

	/** Handle Webhook calls
	 * 
	 * @param {Request} req Incoming request
	 */
	private async handleWebhook( req: Request ): Promise<Response>
	{
		if ( req.headers.get( 'x-github-event' ) )
		{
			const body = await req.json();
			const eventName = req.headers.get( 'x-github-event' ) || 'github';
			this.discord.handleGithubEvent( eventName, body );
		}

		// body = x-www-form-urlencoded
		if ( req.headers.get( 'user-agent' ) === 'Kofi.Webhooks' )
		{
			const body = await req.text();
			const kofiData: KofiData = JSON.parse( decodeURIComponent( body.replace(/^data=/, '') ) );
			this.twitch.handleKofiEvent( kofiData );
		}

		return new Response( null, { status: 204 });
	}

	/** Handle API calls
	 * 
	 * @param {Request} req Incoming Request
	 */
	private async handleApi( req: Request ): Promise<Response>
	{
		let body: ApiRequest;
		let response: ApiResponse = { data: 'Your JSON sucks' }
		try
		{
			body = await req.json();
			//log( `› SERVER: API call` );
			//log( `    REQUEST HEADERS: ${ JSON.stringify( req.headers ) }` );
			//log( `    REQUEST BODY: ${ JSON.stringify( body ) }` );
			log( body.request );
		}
		catch( error: unknown )
		{
			log( error );
			return new Response( JSON.stringify( response ), { status: 400 } );
		}

		response = await this.twitch.processApiCall( body );
		const statusCode = response.data ? 200 : 400;

		return new Response(
			JSON.stringify( response ),
			{
				status: statusCode,
				headers: {
					'content-type': 'application/json',
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

			Deno.exit();
		});
	}
}
