/**
 * This file builds the overlay workspace (react app)
 * 
 * @author Wellington Estevo
 * @version 1.0.11
 */

import * as esbuild from 'esbuild';
import { log } from '@propz/helpers.ts';

const botUrl = Deno.env.get( 'BOT_URL' ) || '';
const rootDir = 'obs-overlays';

try {
	// Remove existing build directory
	try {
		await Deno.remove( `${rootDir}/public/build`, { recursive: true });
	} catch (error) {
		// Ignore error if directory doesn't exist
		if (!(error instanceof Deno.errors.NotFound)) {
			throw error;
		}
	}

	// Create fresh build directory
	await Deno.mkdir( `${rootDir}/public/build`, { recursive: true });

	// Build JS bundle
	const jsCtx = await esbuild.context({
		entryPoints: [ `${rootDir}/src/main.tsx` ],
		bundle: true,
		outfile: `${rootDir}/public/build/app.js`,
		format: 'esm',
		platform: 'browser',
		jsx: 'automatic',
		sourcemap: true,
		define: {
			'process.env.BOT_URL': `"${botUrl}"`
		},
		minify: true,
		alias: {
			'@propz': './shared/',
		}
	});

	// Build CSS bundle
	const cssCtx = await esbuild.context({
		entryPoints: [ `${rootDir}/src/css/App.css` ],
		bundle: true,
		target: [ 'chrome103' ],
		outfile: `${rootDir}/public/build/app.css`,
		loader: { '.css': 'css' },
		minify: true
	});

	// Build both bundles
	await Promise.all([
		jsCtx.rebuild(),
		cssCtx.rebuild()
	]);

	// Cleanup
	await Promise.all([
		jsCtx.dispose(),
		cssCtx.dispose()
	]);

	log( '✅ Build completed successfully' );
	esbuild.stop();
	Deno.exit(0);
}
catch ( error: unknown )
{
	log( error );
	esbuild.stop();
	Deno.exit(1);
}