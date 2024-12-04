/**
 * Main COmponent
 * 
 * @author Wellington Estevo
 * @version 1.0.14
 */

import Alerts from './Alerts.tsx';
import AdBreakBox from './AdBreakBox.tsx';
import EmoteEffects from './EmoteEffects.tsx';

const Main = () =>
{
	return(
		<>
			<AdBreakBox />
			<Alerts />
			<EmoteEffects />
		</>
	);
}

export default Main;