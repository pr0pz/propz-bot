import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import Alert from '@components/Alert.tsx';
import { log } from '@shared/helpers.ts';
import type { WebSocketData } from '@shared/types.ts';

const Alerts = () =>
{
	const event = useEvent() as CustomEvent;
	const [currentAlert, setAlert] = useState<WebSocketData>();
	const [eventQueue, setEventQueue] = useState<WebSocketData[]>([]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	const events = new Map([
		[ 'ban', { 'media': 'ban.gif' } ],
		[ 'chatscore', { 'media': 'chatscore.webm' } ],
		[ 'cheer', { 'media': 'cheer.webm' } ],
		[ 'communitysub-1', {
			'media': 'communitysub-1.webm',
		} ],
		[ 'communitysub-2', {
			'media': 'communitysub-2.webm',
		} ],
		[ 'communitysub-3', {
			'media': 'communitysub-3.webm',
			'audio': 'communitysub-2.mp3'
		} ],
		[ 'communitysub-4', {
			'media': 'communitysub-4.webm',
			'audio': 'communitysub-2.mp3'
		} ],
		[ 'communitysub-5', {
			'media': 'communitysub-5.webm',
			'audio': 'communitysub-2.mp3'
		} ],
		[ 'communitysub-6', {
			'media': 'communitysub-6.webm',
			'audio': 'communitysub-2.mp3'
		} ],
		[ 'communitysub-7', {
			'media': 'communitysub-2.webm',
			'audio': 'communitysub-2.mp3'
		} ],
		[ 'firstchatter', { 'media': 'firstchatter.gif' } ],
		[ 'follow', { 'media': 'follow.webm' } ],
		[ 'kofidonation', { 'media': 'kofidonation.webm' } ],
		[ 'kofisubscription', { 'media': 'kofidonation.webm' } ],
		[ 'raid', { 'media': 'raid.webm' } ],
		[ 'resub-1', { 'media': 'resub-1.webm' } ],
		[ 'resub-2', {
			'media': 'resub-2.webm',
			'audio': 'resub-1.mp3'
		} ],
		[ 'resub-3', {
			'media': 'resub-2.webm',
			'audio': 'resub-1.mp3'
		} ],
		[ 'resub-4', {
			'media': 'resub-2.webm',
			'audio': 'resub-1.mp3'
		} ],
		[ 'resub-5', {
			'media': 'resub-2.webm',
			'audio': 'resub-1.mp3'
		} ],
		[ 'sub', { 'media': 'sub.webm' } ],
		[ 'subgift', { 'media': 'subgift.webm' } ],
		[ 'rewardwrongscene', { 'noAudio': true } ],
		[ 'rewardtts', { 'noAudio': true } ]
	]);

	useEffect( () =>
	{
		if (
			!event?.detail?.type ||
			(
				!events.has( event.detail.type ) &&
				!event.detail?.extra?.titleAlert
			)
		) return;

		enqueueEvent( event.detail );
	},
	[ event ]);

	// Process event queue on state change
	useEffect( () => processEventQueue(),[ eventQueue, isAnimating, currentAlert ])

	/** Process Event queue */
	const processEventQueue = () =>
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
			setEventQueue( (eventQueue: WebSocketData[]) => eventQueue.slice(1) );
			setIsAnimating( false );
			// ??
			// Remove to test
			setAlert( undefined );
			log( `timeout passed` );
		}, 10000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	};

	/** Enqueue event in waitlist
	 *
	 * @param {WebSocketData} eventDetails All event details
	 */
	const enqueueEvent = ( eventDetails: WebSocketData ) =>
	{
		setEventQueue( (prevEvents: WebSocketData[]) => [...prevEvents, eventDetails] );
		log( eventDetails.type );
	};

	/** Process incoming events.
	 *
	 * @param {WebSocketData} eventDetails All event details
	 */
	const processEvent = ( eventDetails: WebSocketData ) =>
	{
		setAlert( eventDetails );
		log( eventDetails.type );
	}

	/** Render current alert.
	 *
	 * @param {WebSocketData} eventDetails
	 */
	const renderAlert = ( eventDetails: WebSocketData ) =>
	{
		return <Alert user={ eventDetails.user } profilePictureUrl={ eventDetails.profilePictureUrl } type={ eventDetails.type } title={ eventDetails.extra?.titleAlert ?? '' } count={ eventDetails.count ?? 0 } text={ eventDetails.text ?? '' } noAudio={ events.get( eventDetails.type )?.noAudio ?? false } color={ eventDetails.color } media={ events.get( eventDetails.type )?.media || '' } audio={ events.get( eventDetails.type )?.audio || eventDetails.type + '.mp3' } key={ eventDetails.key } />
	}

	if ( !currentAlert ) return;

	return(
		<section id="alerts">
			{ renderAlert( currentAlert ) }
		</section>
	);
}

export default Alerts;
