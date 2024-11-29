/**
 * This file starts the dev server for the overlay workspace (react app)
 * 
 * @author Wellington Estevo
 * @version 1.0.2
 */

import { serveDir } from '@std/http/file-server';
import * as esbuild from 'esbuild';

const botUrl = Deno.env.get('BOT_URL') || '';
const obsUrl = Deno.env.get( 'OBS_WEBSOCKET_URL' ) || '';
const obsPort = Deno.env.get( 'OBS_WEBSOCKET_PORT' ) || '';
const obsPassword = Deno.env.get( 'OBS_WEBSOCKET_PASSWORD' ) || '';
const consoleSuccess = Deno.env.get( 'CONSOLE_SUCCESS' ) || '';

const rootDir = 'obs-overlays';
const tmpDir = await Deno.makeTempDir();

async function requestHandler(req: Request): Promise<Response>
{
	const { pathname} = new URL( req.url );

	// Serve files in /dist folder from temp folder
	if ( pathname.startsWith( '/dist' ) )
	{
		return serveDir(req, { 
			fsRoot: tmpDir,
			urlRoot: 'dist'
		});
	}

	// Serve static files from public folder
	if (
		pathname.startsWith( '/img' ) ||
		pathname.startsWith( '/sound' ) ||
		pathname.startsWith( '/video' )
	)
	{
		return serveDir( req, {
			fsRoot: `./${rootDir}/public`
		});
	}

	// Server public index.html as default response
	const html = await Deno.readTextFile( `./${rootDir}/public/index.html`);
	return new Response( html, {
		headers: { 'content-type': 'text/html' }
	});
}

async function cleanup()
{
	await jsCtx.dispose();
	await cssCtx.dispose();
	await Deno.remove(tmpDir, { recursive: true });
	console.log('› 🧹 Cleanup');
}

try {
	// Build JS bundle
	const jsCtx = await esbuild.context({
		entryPoints: [ `${rootDir}/src/main.tsx` ],
		bundle: true,
		outfile: `${tmpDir}/bundle.js`,
		format: 'esm',
		platform: 'browser',
		jsx: 'automatic',
		sourcemap: true,
		define: {
			'process.env.NODE_ENV': '"development"',
			'process.env.BOT_URL': `"${botUrl}"`,
			'process.env.OBS_WEBSOCKET_URL': `"${obsUrl}"`,
			'process.env.OBS_WEBSOCKET_PORT': `"${obsPort}"`,
			'process.env.OBS_WEBSOCKET_PASSWORD': `"${obsPassword}"`,
			'process.env.CONSOLE_SUCCESS': `"${consoleSuccess}"`
		}
	});

	// Build CSS file
	const cssCtx = await esbuild.context({
		entryPoints: [ `${rootDir}/src/css/App.css`],
		bundle: true,
		outfile: `${tmpDir}/app.css`,
		loader: { '.css': 'css' },
		minify: true
	});

	// Start watching both contexts
	await Promise.all([
		jsCtx.watch(),
		cssCtx.watch()
	]);

	console.log('› esbuild watching for changes...');

	Deno.serve( { hostname: '127.0.0.1'}, requestHandler );
	Deno.addSignalListener('SIGTERM', cleanup);
	Deno.addSignalListener('SIGINT', cleanup);
}
catch (error)
{
	console.error(error);
	Deno.exit(1);
}
