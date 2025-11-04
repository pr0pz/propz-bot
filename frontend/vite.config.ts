/**
 * Vite config for frontend (React overlay)
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import { defineConfig } from 'npm:vite';
import react from '@vitejs/plugin-react';
import deno from '@deno/vite-plugin';

const botUrl = JSON.stringify( Deno.env.get( 'BOT_URL' ) ) || '';
const obsPassword = JSON.stringify( Deno.env.get( 'OBS_WEBSOCKET_PASSWORD' ) ) || '';

export default defineConfig( {
	plugins: [
		deno(),
		react()
	],
	define: {
		'process.env.BOT_URL': botUrl,
		'process.env.OBS_PASSWORD': obsPassword
	},
	build: {
		target: 'chrome127'
	},
	server: {
		port: 3000,
		open: true,
		strictPort: true
	}
} );
