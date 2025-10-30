/**
 * Main COmponent
 * 
 * @author Wellington Estevo
 * @version 1.2.2
 */

import Alerts from './Alerts.tsx';
import AdBreakBox from './AdBreakBox.tsx';
import EmoteEffects from './EmoteEffects.tsx';
import Mediaboard from './Mediaboard.tsx';
import Raid from './Raid.tsx';

const Main = () =>
{
	return(
		<>
			<AdBreakBox />
			<Alerts />
			<EmoteEffects />
			<Mediaboard />
			<Raid />
		</>
	);
}

export default Main;