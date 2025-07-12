/**
 * This file starts the dev server for the overlay workspace (react app)
 *
 * @author Wellington Estevo
 * @version 1.6.10
 */

import { log } from '@propz/helpers.ts';
import { serveDir } from '@std/http/file-server';
import * as esbuild from 'esbuild';

const botUrl = Deno.env.get( 'BOT_URL' ) || '';
const obsPassword = Deno.env.get( 'OBS_WEBSOCKET_PASSWORD' ) || '';
const rootDir = 'obs-overlays';
const tmpDir = await Deno.makeTempDir();
const clients = new Set<WebSocket>();
let jsCtx: any;
let cssCtx: any;

function requestHandler( req: Request )
{
	const { pathname } = new URL( req.url );

	// Add WebSocket endpoint for live reload
	if ( pathname === '/esbuild' )
	{
		const { socket, response } = Deno.upgradeWebSocket( req );
		clients.add( socket );
		socket.onclose = () => clients.delete( socket );
		return response;
	}

	// Serve files in /dist folder from temp folder
	if ( pathname.startsWith( '/build' ) )
	{
		return serveDir( req, {
			fsRoot: tmpDir,
			urlRoot: 'build'
		} );
	}

	// Serve static files from public folder
	if (
		pathname.startsWith( '/img' ) ||
		pathname.startsWith( '/audio' ) ||
		pathname.startsWith( '/video' )
	)
	{
		return serveDir( req, {
			fsRoot: `./${rootDir}/public`
		} );
	}

	// Server public index.html as default response
	// Add websocket conenction for hot reload
	const html = Deno.readTextFileSync( `./${rootDir}/public/index.html` ).replace( '</body>',
		'<script>new WebSocket("ws://127.0.0.1:3000/esbuild").addEventListener("message", () => location.reload());</script></body>' );
	return new Response( html, {
		headers: { 'content-type': 'text/html' }
	} );
}

function cleanup()
{
	jsCtx.dispose();
	cssCtx.dispose();
	Deno.remove( tmpDir, { recursive: true } );
	log( '🧹 Cleanup' );
	esbuild.stop();
}

function sendReload()
{
	for ( const client of clients )
	{
		try
		{
			client.send( 'reload' );
		}
		catch
		{
			clients.delete( client );
		}
	}
}

try
{
	// Build JS bundle
	jsCtx = await esbuild.context( {
		entryPoints: [ `${rootDir}/src/index.tsx` ],
		bundle: true,
		outfile: `${tmpDir}/app.js`,
		format: 'esm',
		platform: 'browser',
		jsx: 'automatic',
		sourcemap: true,
		define: {
			'process.env.BOT_URL': `"${botUrl}"`,
			'process.env.OBS_WEBSOCKET_PASSWORD': `"${obsPassword}"`
		},
		plugins: [ {
			name: 'reload',
			setup( build )
			{
				build.onEnd( () =>
				{
					sendReload();
				} );
			}
		} ],
		alias: {
			'@propz': './shared/'
		}
	} );

	// Build CSS file
	cssCtx = await esbuild.context( {
		entryPoints: [ `${rootDir}/src/css/App.css` ],
		bundle: true,
		outfile: `${tmpDir}/app.css`,
		target: [ 'chrome127' ],
		loader: { '.css': 'css' },
		minify: true,
		plugins: [ {
			name: 'reload',
			setup( build )
			{
				build.onEnd( () =>
				{
					sendReload();
				} );
			}
		} ]
	} );

	// Start watching both contexts
	await Promise.all( [
		jsCtx.watch(),
		cssCtx.watch()
	] );

	log( 'watching for changes...' );

	Deno.serve( { hostname: '127.0.0.1', port: 3000 }, requestHandler );
	Deno.addSignalListener( 'SIGTERM', cleanup );
	Deno.addSignalListener( 'SIGINT', cleanup );
}
catch ( error: unknown )
{
	log( error );
	Deno.exit( 1 );
}
