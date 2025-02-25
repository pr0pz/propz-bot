/**
 * Media Manager
 * 
 * @author Wellington Estevo
 * @version 1.4.3
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '@propz/helpers.ts';
import type { TwitchCommand, TwitchEvent, WebSocketData } from '@propz/types.ts';

const Mediaboard = () =>
{
	const event: CustomEvent = useEvent();
	const [mediaQueue, setMediaQueue] = useState<WebSocketData[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [avatar, setAvatar] = useState(<></>);

	useEffect( () =>
	{
		const setInitialMedia = async () =>
		{
			let urlPrefix = 'https';
			if ( process.env.BOT_URL.includes( 'localhost' ) || process.env.BOT_URL.includes( '127.0.0.1' ) )
				urlPrefix = 'http';

			const fetchOptions = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: '{ "request": "chatCommands" }'
			};
	
			try {
				const response = await fetch( `${urlPrefix}://${ process.env.BOT_URL }/api`, fetchOptions );
				const data = await response.json();
	
				if ( !data ) return;
		
				for( const commandName of Object.keys( data.data ) )
				{
					const command = data.data[ commandName ];
					const mediaName = getMediaNameFromApiData( command, commandName );
	
					if ( command.hasSound ) addMedia( 'audio', mediaName );
					if ( command.hasVideo ) addMedia( 'video', mediaName );
				}
			}
			catch ( error: unknown ) { log( error ) }
	
			fetchOptions.body = '{ "request": "getEvents" }'
	
			try {
				const response = await fetch( `${urlPrefix}://${ process.env.BOT_URL }/api`, fetchOptions );
				const data = await response.json();
	
				if ( !data ) return;
		
				for( const eventName of Object.keys( data.data ) )
				{
					const event = data.data[ eventName ];
					const mediaName = getMediaNameFromApiData( event, eventName );
	
					if ( event.hasSound ) addMedia( 'audio', mediaName );
					if ( event.hasVideo ) addMedia( 'video', mediaName );
				}
			}
			catch ( error: unknown ) { log( error ) }
		}

		setInitialMedia();

	},[] );

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

		playMedia( mediaQueue[0] );
		addAvatar( mediaQueue[0] );
	};

	
	/** Play actual audio/video
	 * 
	 * @param {WebSocketData} media
	 */
	const playMedia = ( media: WebSocketData ) =>
	{
		const mediaName = getMediaNameFromLiveEvent( media );

		if ( media.hasSound )
		{
			const audio = document.getElementById( `audio-${mediaName}` ) as HTMLAudioElement;
			console.log( audio, audio.src, audio.id );
			if ( audio )
			{
				audio.style.visibility = 'visible';
				audio.play().catch( ( error: unknown ) =>
				{
					log( error );
					resetMedia();
				})
				.then( () => log( `playing ▶️ ${ mediaName }` ) );
			}
		}
		if ( media.hasVideo )
		{
			const video = document.getElementById( `video-${mediaName}` ) as HTMLVideoElement;
			if ( video )
			{
				video.style.visibility = 'visible';
				video.play().catch( ( error: unknown ) =>
				{
					log( error );
					resetMedia();
				})
				.then( () => log( `playing ▶️ ${ mediaName }` ) );
			}
		}
	}

	/** Reset Single Media play state
	 * 
	 * @param {HTMLAudioElement|HTMLVideoElement} mediaElement
	 */
	const resetMedia = ( event?: Event ) =>
	{
		const target = event?.target ? event.target as HTMLAudioElement|HTMLVideoElement : false;
		if ( target )
		{
			target.style.visibility = 'hidden';
			target.currentTime = 0;
		}
		setAvatar( <></> );
		setIsPlaying( false );
		setMediaQueue( (mediaQueue: WebSocketData[]) => mediaQueue.slice(1) );
	}

	/** Add Avatar to DOM for animation
	 * 
	 * @param {WebSocketData} media
	*/
	const addAvatar = ( media: WebSocketData ) =>
	{
		if ( !media.showAvatar ) return;
		setAvatar( <img id="avatar" className={ 'event-' + media.type } src={ media.profilePictureUrl } /> );
	}

	/** Add Element to DOM
	 * 
	 * @param {string} type
	 * @param {string} mediaName
	 */
	const addMedia = ( type: string, mediaName: string ) =>
	{
		if ( !type || !mediaName ) return;
		
		// Actual media element
		const media = document.createElement( type ) as HTMLAudioElement|HTMLVideoElement;
		media.id = `${type}-${mediaName}`;
		media.src = `/${type}/${media.id}.${ ( type === 'audio' ? 'mp3' : 'webm' ) }`;
		media.volume = 1;
		media.loop = false;
		media.style.visibility = 'hidden';
		media.addEventListener( 'ended', ( event: Event ) => { resetMedia( event ) } );

		// Link element for preload reasons
		const link = document.createElement( 'link' ) as HTMLLinkElement;
		link.rel = 'preload';
		link.as = type;
		link.href = media.src;

		document.getElementById( 'mediaboard' )?.appendChild( media );
		document.head.appendChild( link );
	}

	/** Get the right Video/Audio file name
	 * 
	 * text = command to lower case
	 * type = rewards -> alle sound/video rewards haben keinen text
	 */
	const getMediaNameFromApiData = ( data: TwitchCommand|TwitchEvent, dataName: string = '' ) =>
	{
		if ( !data || !dataName ) return '';

		if ( typeof data?.hasSound === 'string' )
			return data.hasSound;

		if ( typeof data?.hasVideo === 'string' )
			return data.hasVideo;

		return dataName;
	}

	/** Get the right Video/Audio file name
	 * 
	 * text = command to lower case
	 * type = rewards -> alle sound/video rewards haben keinen text
	 */
	const getMediaNameFromLiveEvent = ( media: WebSocketData ) =>
	{
		if ( !media ) return '';

		if ( typeof media.hasSound === 'string' )
			return media.hasSound;

		if ( typeof media.hasVideo === 'string' )
			return media.hasVideo;

		return media.type?.startsWith( 'reward' ) ? media.type : ( media.text || media.type );
	}

	return( <div id="mediaboard">{ avatar }</div> );
}

export default Mediaboard;