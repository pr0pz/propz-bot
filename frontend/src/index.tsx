import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import './css/App.css';

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
