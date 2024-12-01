/**
 * Media Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '../../../shared/helpers.ts';

const Mediaboard = () =>
{
	const event = useEvent();
	const [mediaQueue, setMediaQueue] = useState<string[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect( () =>
	{
		if ( event.detail?.text === 'clear' )
		{
			setMediaQueue();
			setIsPlaying(false);
			return;
		}

		if (
			!event?.detail?.hasSound &&
			!event?.detail?.hasVideo
		) return;

		const mediaName = event.detail.type === 'command' ? event.detail.text.replace( '!', '' ) : event.detail.type;
		enqueueMedia( mediaName );
	},
	[event]);

	useEffect( () => processMediaQueue(), [ mediaQueue, isPlaying ] );

	/** Process Event queue */
	const processMediaQueue = () =>
	{
		if ( isPlaying || mediaQueue.length === 0 ) return;
		setIsPlaying( true );

		playAudio( mediaQueue[0] );
		playVideo( mediaQueue[0] );
	};

	/** Enqueue event in waitlist
	 * 
	 * @param {string} mediaName 
	 */
	const enqueueMedia = ( mediaName: string ) =>
	{
		setMediaQueue( (prevEvents: string[]) => [...prevEvents, mediaName] );
		log( `enqueueMedia - ${ mediaName }` );
	};

	/** Play audio file */
	const playAudio = ( mediaName: string ) =>
	{
		try {
			const audio = new Audio( `sound/sound-${mediaName}.mp3` );
			audio.volume = 1;
			audio.loop = false;
			audio.play().catch((_error) => {
				log( new Error( `Couldn't play sound file ${mediaName}` ) );
				audio.pause();
				audio.currentTime = 0;
				setIsPlaying(false);
				setMediaQueue( (mediaQueue: string[]) => mediaQueue.slice(1));
				return;
			});

			log( `playing ▶️ ${ mediaName }` );

			audio.addEventListener( 'ended', () =>
			{
				audio.pause();
				audio.currentTime = 0;
				setIsPlaying( false );
				setMediaQueue( (mediaQueue: string[]) => mediaQueue.slice(1) );
			});
		}
		catch( error: unknown ) { log( error ) }
	}

	/** Play video file */
	const playVideo = ( mediaName: string ) =>
	{
		try {
			const video = document.createElement('video');
			video.src = `video/video-${mediaName}.webm`;
			video.id = 'videoboard';
			video.volume = 1;
			video.loop = false;
			//video.addEventListener( 'error', () => {} );

			document.body.appendChild(video);

			video.play().catch((_error) => {
				log( new Error( `Couldn't play video file ${mediaName}` ) );
				video.remove();
				setIsPlaying(false);
				setMediaQueue( (mediaQueue: string[]) => mediaQueue.slice(1));
				return;
			});

			log( `playing ▶️ ${ mediaName }` );

			video.addEventListener( 'ended', () =>
			{
				video.pause();
				video.currentTime = 0;
				video.remove();
				setIsPlaying( false );
				setMediaQueue( (mediaQueue: string[]) => mediaQueue.slice(1) );
			});
		}
		catch( error: unknown ) { log( error )}
	}

	return;
}

export default Mediaboard;