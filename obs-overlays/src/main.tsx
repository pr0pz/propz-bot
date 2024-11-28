/**
 * Index
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';

const rootElement = document.getElementById( 'root' );
if ( rootElement )
{
	const root = createRoot(rootElement);
	root.render(
		<BrowserRouter>
			<App />
		</BrowserRouter>
	);
}