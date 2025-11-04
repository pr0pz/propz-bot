/**
 * App
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

// Controllers
import { EventProvider } from '@frontend/EventContext.tsx';
import Chat from '@components/Chat.tsx';
import Events from '@components/Events.tsx';
import Main from '@components/Main.tsx';
import Focus from '@components/Focus.tsx';
import Credits from '@components/Credits.tsx';
import Weather from '@components/Weather.tsx';

const App = () =>
{
	const location = useLocation();

	useEffect( () =>
	{
		console.log('%c PROPZ', 'font-weight: 900; font-size: 40px; font-family: "Colombo Sans Font"; color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113); padding:0 20px 20px 0;');
	},
	[]) // eslint-disable-line react-hooks/exhaustive-deps

	return(
		<section id="wrapper">
			<Routes location={ location } key={ location.key }>
				<Route path="/" element={ <EventProvider><Main /></EventProvider> } />
				<Route path="/chat" element={ <EventProvider><Chat /></EventProvider> } />
				<Route path="/events" element={ <EventProvider><Events /></EventProvider> } />
				<Route path="/focus" element={ <EventProvider><Focus /></EventProvider> } />
				<Route path="/credits" element={ <EventProvider><Credits /></EventProvider> } />
				<Route path="/weather" element={ <Weather /> } />
			</Routes>
		</section>
	)
}

export default App;
