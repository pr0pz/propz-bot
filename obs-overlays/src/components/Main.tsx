/**
 * Main COmponent
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import Alerts from './Alerts.tsx';
import AdBreakBox from './AdBreakBox.tsx';

const Main = () =>
{
	return(
		<>
			<AdBreakBox />
			<Alerts />
		</>
	);
}

export default Main;