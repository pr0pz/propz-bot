/**
 * Media Manager
 * 
 * @author Wellington Estevo
 * @version 1.2.3
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '@propz/helpers.ts';
import type { WebSocketData } from '@propz/types.ts';

const Mediaboard = () =>
{
	const event: CustomEvent = useEvent();
	const [mediaQueue, setMediaQueue] = useState<WebSocketData[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect( () =>
	{
		if ( !event ) return;

		const detail = event.detail as WebSocketData;
		if ( detail.text === 'clear' )
		{
			setMediaQueue();
			setIsPlaying(false);
			return;
		}

		if (
			!detail.hasSound &&
			!detail.hasVideo
		) return;

		setMediaQueue( ( prevEvents: WebSocketData[] ) => [...prevEvents, detail] );
	},
	[event]);

	useEffect( () => processMediaQueue(), [ mediaQueue, isPlaying ] );

	const processMediaQueue = () =>
	{
		if ( isPlaying || mediaQueue.length === 0 ) return;
		setIsPlaying( true );

		playAudio( mediaQueue[0] );
		playVideo( mediaQueue[0] );
	};

	const playAudio = ( media: WebSocketData ) =>
	{
		if ( !media.hasSound ) return;
		const mediaName = getMediaName( media );
		try {
			const audio = new Audio( `sound/sound-${mediaName}.mp3` );
			audio.volume = 1;
			audio.loop = false;
			audio.play().catch( ( error: unknown ) =>
			{
				log( error );
				audio.remove();
				setIsPlaying(false);
				setMediaQueue( (mediaQueue: WebSocketData[]) => mediaQueue.slice(1));
				return;
			}).then( () => log( `playing ▶️ ${ mediaName }` ) );

			audio.addEventListener( 'ended', () =>
			{
				audio.remove();
				setIsPlaying( false );
				setMediaQueue( (mediaQueue: WebSocketData[]) => mediaQueue.slice(1) );
			});
		}
		catch( error: unknown ) { log( error ) }
	}

	const playVideo = ( media: WebSocketData ) =>
	{
		if ( !media.hasVideo ) return;
		const mediaName = getMediaName( media );
		try {
			const video = document.createElement('video');
			video.src = `video/video-${mediaName}.webm`;
			video.id = 'videoboard';
			video.volume = 1;
			video.loop = false;

			document.body.appendChild(video);

			video.play().catch( ( error: unknown ) =>
			{
				log( error );
				video.remove();
				setIsPlaying(false);
				setMediaQueue( (mediaQueue: WebSocketData[]) => mediaQueue.slice(1));
				return;
			}).then( () => log( `playing ▶️ ${ mediaName }` ) );

			video.addEventListener( 'ended', () =>
			{
				video.remove();
				setIsPlaying( false );
				setMediaQueue( (mediaQueue: WebSocketData[]) => mediaQueue.slice(1) );
			});
		}
		catch( error: unknown ) { log( error ) }
	}

	/**
	 * text = command to lower case
	 * type = rewards -> alle sound/video rewards haben keinen text
	 */
	const getMediaName = ( media: WebSocketData ) => media.type.startsWith( 'reward' ) ? media.type : media.text;

	return( <></> );
}

export default Mediaboard;