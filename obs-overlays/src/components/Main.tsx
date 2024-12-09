/**
 * Main COmponent
 * 
 * @author Wellington Estevo
 * @version 1.1.0
 */

import Alerts from './Alerts.tsx';
import AdBreakBox from './AdBreakBox.tsx';
import EmoteEffects from './EmoteEffects.tsx';
import Raid from './Raid.tsx';

const Main = () =>
{
	return(
		<>
			<AdBreakBox />
			<Alerts />
			<EmoteEffects />
			<Raid />
		</>
	);
}

export default Main;