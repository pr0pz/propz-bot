/**
 * Emote Effects
 *
 * @author Wellington Estevo
 * @version 1.8.4
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '@propz/helpers.ts';

import type { WebSocketData } from '@propz/types.ts';

const EmoteEffects = () =>
{
	const [currentEvent, setEvent] = useState<WebSocketData>();
	const [eventQueue, setEventQueue] = useState<WebSocketData[]>([]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	const event = useEvent() as CustomEvent;
	const events = new Set([ 'rewardrain', 'rewardtornado' ]);

	const configDefaults = {
		minEmotes: 50,
		maxEmotes: 100,
		emoteSize: 100,
		infinite: false,
		velocity: 25,
		maxSwingAngle: 25,
		emoteImages: [
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_be79061517314c0bb5dd0cfe610d5776/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_78340db291d44f4fa2a5a84b375952b7/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_80c586af401c4634b6925bfe7759a13f/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_2f9e53027d37461a9eb22a2dd5fddc69/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_cb95a3189a294235a7326be0bdfc7718/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_e2b1db480a5243c19a72bd70ec98eb27/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_7ed3ff8285954bde88c9530b51c31a07/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c628df4914c04ea89712928eb3e00c1b/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_4534ff50ed2b476f8fc3dd772c8728d0/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_e3a727c581c947cdb7ea0e93f4d0fe40/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d6fe024a463f48d298d4824fe86512cb/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_0812d9fbe830474bb402baa76fbc38f1/animated/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_18b7f03116574747be2a33efd4d42adf/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_16073ef4ea0942deba5ec88d46344690/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_64c0fee62f2f450682631e4e993dca58/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_f6d4a80b970e41778732fbbc69c7f56d/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_b48dabbbda714142973a7d2d058262e0/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_60efb136afd6466e8eef3d317fd77062/static/light/3.0',
			'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_b4a4305a337c4cca9b6c1b3dc2eb86b6/animated/light/3.0'
		]
	}

	useEffect( () =>
	{
		if ( !event?.detail?.type ) return;
		if ( event.detail.text === 'clear' )
		{
			setEvent( undefined );
			return;
		}

		if ( !events.has( event.detail.type ) ) return;
		setEventQueue( ( prevEvents: WebSocketData[] ) => [...prevEvents, event.detail ] )
	},
	[event]);

	useEffect( () => processEventQueue(), [ eventQueue, isAnimating, currentEvent ]);

	const processEventQueue = () =>
	{
		// Wait for animation to end
		if ( isAnimating || eventQueue.length === 0 ) return;

		const nextEvent = eventQueue[0];
		log( nextEvent.type );

		// Trigger animation
		setIsAnimating( true );
		if ( nextEvent.type === 'rewardrain' )
			emoteRain();
		else if ( nextEvent.text === 'rewardtornado' )
			emoteTornado();

		// Simulate some delay for the animation
		// Timeout könnte optional sein, abhängig von der gewünschten Logik
		setTimeout( () =>
		{
			setEventQueue( (eventQueue: WebSocketData[]) => eventQueue.slice(1) );
			setIsAnimating( false );
			// ??
			// Remove to test
			setEvent( undefined );
			document.querySelector( '#animation' )?.remove();
			log( `event processed` );
		}, 50000 ); // Timeout sollte mindestens so groß wie die Animationsdauer sein
	}

	/** Make Emotes Rain.
	 *
	 * Animation by Nelson Rodriques:
	 * https://codepen.io/nelsonr/pen/NEvyWv
	 *
	 * @param {Object} configParam - Contains the rain config.
	 */
	const emoteRain = ( configParam?: any ) =>
	{
		// Basic config
		const config = {
			...configDefaults,
			...configParam
		};

		const getRandomNumber = ( max = 1, min = 0 ) => Math.floor( Math.random() * ( max - min ) ) + min;
		const numberOfEmotes = getRandomNumber( config.maxEmotes, config.minEmotes );

		// Create Canvas + some Settings
		const wrapper = document.createElement( 'div' );
		wrapper.id = 'animation';
		document.body.appendChild( wrapper );

		const canvas = document.createElement( 'canvas' );
		canvas.width = Math.max( document.documentElement.clientWidth || 0, window.innerWidth || 0 );
		canvas.height = Math.max( document.documentElement.clientHeight || 0, window.innerHeight || 0 );
		// Universal styles
		canvas.style.position = 'fixed';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.style.width = '100vw';
		canvas.style.height = '100vh';
		canvas.style.zIndex = '100';

		wrapper.appendChild( canvas );

		const ctx = canvas.getContext( '2d' );

		// Setup and load all images
		const emoteImages = [];
		const totalEmoteImages = config.emoteImages.length;
		let emoteImagesLoaded = 0;
		for ( let i = 0; i < totalEmoteImages; i++ )
		{
			const image = new Image();
			image.src = config.emoteImages[ i ] ? config.emoteImages[ i ] : '';

			if ( image.src )
			{
				image.onload = () => { emoteImagesLoaded++ };
				emoteImages.push( image );
			}
		}

		// Setup initial random vars for all emotes
		const emotes = [];
		for ( let i = 0; i < numberOfEmotes; i++ )
		{
			// Bigger angle = bigger swing
			const angle = getRandomNumber( config.maxSwingAngle, config.maxSwingAngle / 2 );
			// Swing intensity = lower number means bigger swing
			const dir = [-1,1][ getRandomNumber( config.maxSwingAngle / 10 ) ];
			// Velocity = y coord change per frame (something between 1 and 2 is good)
			const velocity = config.velocity / angle;

			emotes.push({
				x: getRandomNumber( canvas.width - config.emoteSize / 2 ),
				y: getRandomNumber( -100, canvas.height / 2 * -1 ),
				w: config.emoteSize,
				h: config.emoteSize,
				v: velocity,
				a: angle,
				d: dir,
				i: emoteImages[ getRandomNumber( emoteImages.length ) ]
			});
		}

		/**  Called every frame
		 *
		 * @param {*} dt
		 */
		function update( dt )
		{
			for ( let i = 0; i < emotes.length; i++ )
			{
				emotes[i].y += emotes[i].v;

				// Out of bounds?
				if ( emotes[i].y > canvas.height )
				{
					if ( config.infinite )
					{
						// Reset values
						emotes[i].y = getRandomNumber( -100, canvas.height / 2 * -1 );
						emotes[i].x = getRandomNumber( canvas.width - config.emoteSize / 2 );
					}
					else
					{
						// Remove from array to stop animation
						emotes.slice(i, 1);
					}
				}
			}

			if ( emotes.length < 1 ) return;
		}

		/** Actually draw the stuff
		 *
		 * @param {*} dt
		 */
		function draw( dt )
		{
			// Stop drawing if array is empty
			if ( emotes.length < 1 ) return;
			requestAnimationFrame( draw );

			// Only start updating when all images are loaded
			if ( totalEmoteImages !== emoteImagesLoaded ) return;
			update( dt );

			ctx.clearRect( 0, 0, canvas.width, canvas.height );

			// Draw every single emote
			for ( let i = 0; i < emotes.length; i++)
			{
				ctx.save();
				ctx.translate( emotes[i].x, emotes[i].y );
				// This calcs the swing
				ctx.rotate( emotes[i].d * Math.sin(dt * 0.002 * i * 0.01) * emotes[i].a * Math.PI / 180 );
				// Uncomment to fade them in
				//ctx.globalAlpha = Math.max( 0, emotes[i].y * 0.1 );
				ctx.drawImage( emotes[i].i, -emotes[i].w / 2, 70, emotes[i].w, emotes[i].h );
				ctx.restore();
			}
		}

		draw();
	}

	/** Make the Emote Tornado.
	 *
	 * Animation by Yusuke Nakaya:
	 * https://codepen.io/YusukeNakaya/pen/yzNBpM
	 *
	 * @param {Object} configParam - Contains the rain config
	 */
	const emoteTornado = ( configParam?: any ) =>
	{
		const config = {
			...configDefaults,
			...configParam
		};

		const getRandomNumber = ( max = 1, min = 0 ) => Math.floor( Math.random() * ( max - min ) ) + min;
		const numberOfElements = getRandomNumber( config.maxEmotes, config.minEmotes );

		// Create wrapper
		const wrapper = document.createElement( 'div' );
		wrapper.id = 'animation';
		document.body.appendChild( wrapper );

		// Create Emotes Wrapper
		const emotesWrapper = document.createElement('section');
		emotesWrapper.id = 'propzEmotes';
		emotesWrapper.innerHTML = `<style>
		#propzEmotes{position:fixed;top:0;left:0;width:100vw;height:100vh;transform-style:preserve-3d}
		.propzEmote{position:absolute;width:${config.emoteSize}px;height:${config.emoteSize}px;line-height:${config.emoteSize}px;font-size:${config.emoteSize}px;text-align:center;animation-name:emoteTornado;animation-timing-function:linear;transform:translateY(100vh);opacity:0;top:0}
		@keyframes emoteTornado{
			0%{transform:rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0); opacity:0}
			10%{transform:rotateX(30deg) rotateY(30deg) rotateZ(30deg) translateY(20vh); opacity:1}
			50%{transform:rotateX(180deg) rotateY(180deg) rotateZ(180deg) translateY(60vh);opacity:1}
			90%{transform:rotateX(330deg) rotateY(360deg) rotateZ(330deg) translateY(110vh);opacity:1}
			100%{transform:rotateX(360deg) rotateY(540deg) rotateZ(360deg) translateY(120vh);opacity:0}
		}
		</style>`;

		wrapper.appendChild( emotesWrapper );

		// Actually create all emote elements
		for( let i = 1; i <= numberOfElements; i++ )
		{
			// Create new emote
			const emote = document.createElement( 'img' );
			emote.id = `propzEmote-${i}`;
			emote.classList.add( 'propzEmote' );
			//emote.innerHTML = '🎉';
			emote.src = config.emoteImages[ getRandomNumber( config.emoteImages.length ) ];

			// Randomize Animation stuff
			emote.style.left = `${ getRandomNumber( 100 ) }%`;
			emote.style.transform = `translateY(-${ config.emoteSize * config.emoteSize }px)`;
			emote.style.animationDelay = `${ getRandomNumber( 3000 ) }ms`;
			emote.style.animationDuration = `${ getRandomNumber( 5000 ) + 15000 }ms`;

			emotesWrapper.appendChild( emote );
		}
	}

	return '';
}

export default EmoteEffects;
