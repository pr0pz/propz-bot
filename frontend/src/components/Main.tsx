/**
 * Main COmponent
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import Alerts from '@components/Alerts.tsx';
import AdBreakBox from '@components/AdBreakBox.tsx';
import EmoteEffects from '@components/EmoteEffects.tsx';
import Mediaboard from '@components/Mediaboard.tsx';
import Raid from '@components/Raid.tsx';

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
