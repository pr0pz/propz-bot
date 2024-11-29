/**
 * Alert Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.2
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import Alert from './Alert.tsx';
import { log } from '../../../shared/helpers.ts';

const Alerts = () =>
{
	const event = useEvent();
	const [currentAlert, setAlert] = useState();
	const [eventQueue, setEventQueue] = useState([]);
	const [isAnimating, setIsAnimating] = useState(false);
	
	const events = {
		'rewardwrongscene': { 'noAudio': true },
		'rewardtts': { 'noAudio': true }
	};

	useEffect( () =>
	{
		if (
			!event?.detail?.type ||
			(
				!events?.[ event.detail.type ] &&
				!event.detail?.extra?.titleAlert
			)
		) return;

		enqueueEvent( event.detail );
	},
	[ event ]) // eslint-disable-line react-hooks/exhaustive-deps

	// Handling event queue
	useEffect( () =>
	{
		processEventQueue();
	},
	[ eventQueue, isAnimating, currentAlert ]) // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Process Event queue.
	 * 
	 * @returns {void}
	 */
	const processEventQueue = async () =>
	{
		// Wait for animation to end
		if ( isAnimating || eventQueue.length === 0 ) return;

		const nextEvent = eventQueue[0];
		log( nextEvent.type );

		// Trigger animation
		setIsAnimating( true );
		// Process Event
		processEvent( nextEvent );
		// Simulate some delay for the animation
		// Timeout könnte optional sein, abhängig von der gewünschten Logik
		setTimeout( () =>
		{
			setEventQueue( (eventQueue) => eventQueue.slice(1) );
			setIsAnimating( false );
			// ??
			// Remove to test
			setAlert();
			log( `timeout passed` );
		}, 10000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	};

	/**
	 * Enqueue event in waitlist
	 * 
	 * @param {Object} event 
	 */
	const enqueueEvent = ( eventDetails ) => {
		setEventQueue( prevEvents => [...prevEvents, eventDetails] );
		log( eventDetails.type );
	};

	/**
	 * Process incoming events.
	 * 
	 * eventDetails {
		color: "#ffff00"
		count: 9
		key: "998c075d-df99-4eaa-9b62-117507b1be2a"
		profilePictureUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/17cfddab-98e3-4a74-ae9e-366ededf0c8e-profile_image-300x300.png"
		text: ""
		type: "raid"
		user: "PropzMaster",
		extraData: {
			"title_alert": "XXX",
			"title_event": "XXX"
		},
		obs: {
			...
		}
	}
	 * 
	 * @param {Object} eventDetails All event details
	 */
	const processEvent = ( eventDetails ) =>
	{
		/*if ( eventDetails.type === 'emoterain' )
		{
			EmoteEffects.emoteRain();
			setAlert();
			return;
		}*/
		setAlert( eventDetails );
		log( eventDetails.type );
	}

	/**
	 * Render current alert.
	 * 
	 * @param {Object} data 
	 * @returns {React.JSX.Element}
	 */
	const renderAlert = ( data ) =>
	{
		return <Alert user={ data.user } profilePictureUrl={ data.profilePictureUrl } type={ data.type } title={ data.extra?.titleAlert ?? '' } count={ data.count ?? 0 } text={ data.text ?? '' } noAudio={ events?.[ data.type ]?.noAudio ?? false } color={ data.color } key={ data.key } />
	}

	if ( !currentAlert ) return;

	return(
		<section id="alerts">
			{ renderAlert( currentAlert ) }
		</section>
	);
}

export default Alerts;
