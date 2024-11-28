/**
 * Media Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';

const Mediaboard = () =>
{
	const event = useEvent();
	const [mediaQueue, setMediaQueue] = useState<string[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect( () =>
	{
		if (
			(
				!event?.detail?.hasSound &&
				!event?.detail?.hasVideo
			) ||
			!event.detail.type
		) return ( () => {} );

		const mediaName = event.detail.type === 'command' ? event.detail.text.replace( '!', '' ) : event.detail.type;
		enqueueMedia( mediaName );
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () =>
	{
		processMediaQueue();
	},
	[ mediaQueue, isPlaying ]) // eslint-disable-line react-hooks/exhaustive-deps

	/** Process Event queue */
	const processMediaQueue = async () =>
	{
		if ( isPlaying || mediaQueue.length === 0 ) return;
		setIsPlaying( true );

		playAudio( mediaQueue[0] );
		playVideo( mediaQueue[0] );
	};

	/** Enqueue event in waitlist
	 * 
	 * @param {Object} event 
	 */
	const enqueueMedia = ( mediaName: string ) =>
	{
		setMediaQueue( prevEvents => [...prevEvents, mediaName] );
		console.log( `%c› SOUNDBOARD: enqueueMedia - ${ mediaName }`, process.env.CONSOLE_SUCCESS );
	};

	const playAudio = ( mediaName: string ) =>
	{
		try {
			const audio = new Audio( `sound/sound-${mediaName}.mp3` );
			audio.volume = 1;
			audio.loop = false;
			audio.play().catch((error) => {
				console.warn( `› MEDIABOARD: Couldn't play sound file ${mediaName} › ${error.message}` );
				audio.pause();
				audio.currentTime = 0;
				setIsPlaying(false);
				setMediaQueue( mediaQueue => mediaQueue.slice(1));
				return;
			});

			console.log( `%c› MEDIABOARD: playing ▶️ ${ mediaName }`, process.env.CONSOLE_SUCCESS );

			audio.addEventListener( 'ended', () =>
			{
				audio.pause();
				audio.currentTime = 0;
				setIsPlaying( false );
				setMediaQueue( mediaQueue => mediaQueue.slice(1) );
			});
		}
		catch( error: unknown )
		{
			console.warn( `› MEDIABOARD: Couldn't play sound file ${mediaName} › ${error?.message}` );
		}
	}

	const playVideo = ( mediaName ) =>
	{
		const video = document.createElement('video');
		video.src = `video/video-${mediaName}.webm`;
		video.id = 'videoboard';
		video.volume = 1;
		video.loop = false;
		//video.addEventListener( 'error', () => {} );

		try {
			document.body.appendChild(video);

			video.play().catch((error) => {
				console.warn( `› MEDIABOARD: Couldn't play video file ${mediaName} › ${error.message}` );
				video.remove();
				setIsPlaying(false);
				setMediaQueue( mediaQueue => mediaQueue.slice(1));
				return;
			});

			console.log( `%c› MEDIABOARD: playing ▶️ ${ mediaName }`, process.env.CONSOLE_SUCCESS );

			video.addEventListener( 'ended', () =>
			{
				video.pause();
				video.currentTime = 0;
				video.remove();
				setIsPlaying( false );
				setMediaQueue( mediaQueue => mediaQueue.slice(1) );
			});
		}
		catch( error: unknown )
		{
			console.warn( `› MEDIABOARD: Couldn't play video file ${mediaName} › ${error?.message}` );
		}
	}

	return;
}

export default Mediaboard;