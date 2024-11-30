/**
 * App
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

// Controllers
import { EventProvider } from './EventContext.tsx';
import Chat from './components/Chat.tsx';
import Events from './components/Events.tsx';
import Alerts from './components/Alerts.tsx';
import Main from './components/Main.tsx';
import Mediaboard from './components/Mediaboard.tsx';
import LedDisplay from './components/LedDisplay.tsx';
import Focus from './components/Focus.tsx';
import Obs from './components/Obs.tsx';

const App = () =>
{
	const location = useLocation();

	useEffect( () =>
	{
		console.log('%c PROPZ', 'font-weight: 900; font-size: 40px; font-family: "Colombo Sans Font"; color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113); padding:0 20px 20px 0;');
	},
	[]) // eslint-disable-line react-hooks/exhaustive-deps

	return(
		<EventProvider>
			<section id="wrapper">
				<Routes location={ location } key={ location.key }>
					<Route path="/" element={ <Main /> } />
					<Route path="/chat" element={ <Chat /> } />
					<Route path="/alerts" element={ <Alerts /> } />
					<Route path="/events" element={ <Events /> } />
					<Route path="/mediaboard" element={ <Mediaboard /> } />
					<Route path="/leddisplay" element={ <LedDisplay /> } />
					<Route path="/focus" element={ <Focus /> } />
					<Route path="/obs" element={ <Obs /> } />
				</Routes>
			</section>
		</EventProvider>
	)
}

export default App;