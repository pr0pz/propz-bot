/**
 * Media Manager
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import { log } from '@shared/helpers.ts';
import type { TwitchCommand, TwitchEvent, WebSocketData } from '@shared/types.ts';
import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';

const Mediaboard = () =>
{
	const event: CustomEvent = useEvent();
	const [ mediaQueue, setMediaQueue ] = useState<WebSocketData[]>( [] );
	const [ isPlaying, setIsPlaying ] = useState( false );
	const [ avatar, setAvatar ] = useState( <></> );
	const botUrl = process.env.BOT_URL ?? '';

	useEffect( () =>
	{
		const setInitialMedia = async () =>
		{
			let urlPrefix = 'https';
			if ( botUrl.includes( 'localhost' ) || botUrl.includes( '127.0.0.1' ) )
				urlPrefix = 'http';

			const fetchOptions = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: '{ "request": "chatCommands" }'
			};

			try
			{
				const response = await fetch( `${urlPrefix}://${botUrl}/api`, fetchOptions );
				const data = await response.json();

				if ( !data ) return;

				for ( const commandName of Object.keys( data.data ) )
				{
					const command = data.data[commandName];

					if ( command.hasSound ) addMedia( 'audio', getMediaNameFromApiData( command, commandName, 'audio' ) );
					if ( command.hasVideo ) addMedia( 'video', getMediaNameFromApiData( command, commandName, 'video' ) );
					if ( command.hasImage ) addMedia( 'image', getMediaNameFromApiData( command, commandName, 'image' ) );
				}
			}
			catch ( error: unknown ) { log( error ) }

			fetchOptions.body = '{ "request": "getEvents" }';

			try
			{
				const response = await fetch( `${urlPrefix}://${botUrl}/api`, fetchOptions );
				const data = await response.json();

				if ( !data ) return;

				for ( const eventName of Object.keys( data.data ) )
				{
					const event = data.data[eventName];

					if ( event.hasSound ) addMedia( 'audio', getMediaNameFromApiData( event, eventName, 'audio' ) );
					if ( event.hasVideo ) addMedia( 'video', getMediaNameFromApiData( event, eventName, 'video' ) );
					if ( event.hasImage ) addMedia( 'image', getMediaNameFromApiData( event, eventName, 'image' ) );
				}
			}
			catch ( error: unknown ) { log( error ) }
		};

		setInitialMedia();
	}, [] );

	useEffect( () =>
	{
		if ( !event ) return;

		const detail = event.detail as WebSocketData;
		if ( detail.text === 'clear' )
		{
			setMediaQueue();
			setIsPlaying( false );
			return;
		}

		if (
			!detail.hasSound &&
			!detail.hasVideo &&
			!detail.hasImage
		) return;

		setMediaQueue( ( prevEvents: WebSocketData[] ) => [ ...prevEvents, detail ] );
	}, [ event ] );

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
		let mediaName = '';
		if ( media.hasSound )
		{
			mediaName = getMediaNameFromLiveEvent( media, 'audio' );
			const audio = document.getElementById( `audio-${mediaName}` ) as HTMLAudioElement;
			console.log( audio, audio.src, audio.id );
			if ( audio )
			{
				audio.style.visibility = 'visible';
				audio.play().catch( ( error: unknown ) =>
				{
					log( error );
					resetMedia();
				} )
					.then( () => log( `playing ▶️ ${mediaName}` ) );
			}
		}
		if ( media.hasVideo )
		{
			mediaName = getMediaNameFromLiveEvent( media, 'video' );
			const video = document.getElementById( `video-${mediaName}` ) as HTMLVideoElement;
			if ( video )
			{
				video.style.visibility = 'visible';
				video.play().catch( ( error: unknown ) =>
				{
					log( error );
					resetMedia();
				} )
					.then( () => log( `playing ▶️ ${mediaName}` ) );
			}
		}
		if ( media.hasImage )
		{
			mediaName = getMediaNameFromLiveEvent( media, 'image' );
			const image = document.getElementById( `image-${mediaName}` ) as HTMLImageElement;
			if ( image )
			{
				image.style.visibility = 'visible';
				setTimeout( () =>
				{
					setIsPlaying( false );
					image.style.visibility = 'hidden';
				}, 10000 );
			}
		}
	};

	/** Reset Single Media play state
	 *
	 * @param {HTMLAudioElement|HTMLVideoElement} mediaElement
	 */
	const resetMedia = ( event?: Event ) =>
	{
		const target = event?.target ? event.target as HTMLAudioElement | HTMLVideoElement : false;
		if ( target )
		{
			target.style.visibility = 'hidden';
			target.currentTime = 0;
		}
		setAvatar( <></> );
		setIsPlaying( false );
		setMediaQueue( ( mediaQueue: WebSocketData[] ) => mediaQueue.slice( 1 ) );
	};

	/** Add Avatar to DOM for animation
	 *
	 * @param {WebSocketData} media
	 */
	const addAvatar = ( media: WebSocketData ) =>
	{
		if ( !media.showAvatar ) return;
		setAvatar( <img id='avatar' className={'event-' + media.type} src={media.profilePictureUrl} /> );
	};

	/** Add Element to DOM
	 *
	 * @param {string} type
	 * @param {string} mediaName
	 */
	const addMedia = ( type: string, mediaName: string ) =>
	{
		if ( !type || !mediaName ) return;

		// Actual media element
		const media = type === 'image' ?
			document.createElement( type ) as HTMLImageElement :
			document.createElement( type ) as HTMLAudioElement | HTMLVideoElement;

		console.log( type, mediaName, media );

		media.id = `${type}-${mediaName}`;
		media.src = `/${type}/${media.id}.${( type === 'audio' ? 'mp3' : 'webm' )}`;
		media.style.visibility = 'hidden';
		if ( !( media instanceof HTMLImageElement ) )
		{
			media.volume = 1;
			media.loop = false;
			media.addEventListener( 'ended', ( event: Event ) =>
			{
				resetMedia( event );
			} );
		}

		// Link element for preload reasons
		const link = document.createElement( 'link' ) as HTMLLinkElement;
		link.rel = 'preload';
		link.as = type;
		link.href = media.src;

		document.getElementById( 'mediaboard' )?.appendChild( media );
		document.head.appendChild( link );
	};

	/** Get the right Video/Audio file name
	 *
	 * text = command to lower case
	 * type = rewards -> alle sound/video rewards haben keinen text
	 */
	const getMediaNameFromApiData = ( data: TwitchCommand | TwitchEvent, dataName: string = '', type: string ) =>
	{
		if ( !data || !dataName || !type ) return '';

		if ( typeof data?.hasSound === 'string' && type === 'audio' )
			return data.hasSound;

		if ( typeof data?.hasVideo === 'string' && type === 'video' )
			return data.hasVideo;

		if ( typeof data?.hasImage === 'string' && type === 'image' )
			return data.hasImage;

		return dataName;
	};

	/** Get the right Video/Audio file name
	 *
	 * text = command to lower case
	 * type = rewards -> alle sound/video rewards haben keinen text
	 */
	const getMediaNameFromLiveEvent = ( media: WebSocketData, type: string ) =>
	{
		if ( !media || !type ) return '';

		if ( typeof media?.hasSound === 'string' && type === 'audio' )
			return media.hasSound;

		if ( typeof media?.hasVideo === 'string' && type === 'video' )
			return media.hasVideo;

		if ( typeof media?.hasImage === 'string' && type === 'image' )
			return media.hasImage;

		return media.type?.startsWith( 'reward' ) ? media.type : ( media.text || media.type );
	};

	return <div id='mediaboard'>{avatar}</div>;
};

export default Mediaboard;
