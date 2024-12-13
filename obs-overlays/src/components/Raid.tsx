/**
 * Raid
 * 
 * @author Wellington Estevo
 * @version 1.1.0
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import type { WebSocketData } from '@propz/types.ts';

const Raid = () =>
{
	const event = useEvent();
	//const [ raid, setRaid ] = useState( { title: "Let's raid to", user: 'codingPurpurTentakel', profilePictureUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/86b70b66-ecf7-4b85-b3a6-d6d2a9c10c40-profile_image-300x300.png', color: '#8B16A3' } );
	const [ raid, setRaid ] = useState<WebSocketData>();

	useEffect( () =>
	{
		if (
			!event ||
			event.detail.type !== 'startraid'
		) return;

		setRaid( event.detail );

		setTimeout( () => 
		{
			setRaid();
		}, 32000 );
	},
	[event]);

	if ( !raid ) return;

	return(
		<div id="raid" className={ `raid` }>

			<div id="raid-title-wrapper">
				<div id="raid-title" className="window">
					<div className="window-header">
						<span className="window-button red"></span>
						<span className="window-button yellow"></span>
						<span className="window-button green"></span>
					</div>

					<div className="window-body">
						{ raid.text }
					</div>
				</div>
				
				<div id="raid-user" className="window window-dark">
					<div className="window-header">
						<span className="window-button red"></span>
						<span className="window-button yellow"></span>
						<span className="window-button green"></span>
					</div>

					<div className="window-body" style={ { color: raid.color } }>
						{ raid.user }
					</div>
				</div>

			</div>

			<div id="raid-avatar-wrapper">
				<div id="raid-arrows">
					<img src="/img/arrow-1.svg" />
					<img src="/img/arrow-2.svg" />
					<img src="/img/arrow-3.svg" />
				</div>
				
				<div id="raid-avatar">
					<img src={ raid.profilePictureUrl } />
				</div>
			</div>

		</div>
	)
}

export default Raid;