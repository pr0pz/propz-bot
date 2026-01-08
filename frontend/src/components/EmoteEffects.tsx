/**
 * Emote Effects
 *
 * @author Wellington Estevo
 * @version 2.2.2
 */

import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import { log } from '@shared/helpers.ts';
import { randomIntegerBetween, sample } from '@std/random';
import { objectToMap } from '@shared/helpers.ts';

import type { WebSocketData } from '@shared/types.ts';

const EmoteEffects = () =>
{
	const [currentEvent, setEvent] = useState<WebSocketData>();
	const [eventQueue, setEventQueue] = useState<WebSocketData[]>([]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	const event = useEvent() as CustomEvent;
	const events = new Set([ 'rewardemoterain', 'rewardemotetornado' ]);

	const configDefaults = {
		minEmotes: 50,
		maxEmotes: 100,
		emoteSize: 100,
		infinite: false,
		velocity: 25,
		maxSwingAngle: 25
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

	const getEmotes = async (): Promise<Map<string, string>|undefined> =>
	{
		let urlPrefix = 'https';
		if ( process.env.BOT_URL.includes( 'localhost' ) || process.env.BOT_URL.includes( '127.0.0.1' ) )
			urlPrefix = 'http';

		const url = `${ urlPrefix }://${ process.env.BOT_URL }/api`;
		console.log( url );
		const response = await fetch( `${ urlPrefix }://${ process.env.BOT_URL }/api`, {
			body: JSON.stringify(
				{
					request: 'getChannelEmotes'
				}
			),
			method: 'POST',
		} );

		if ( !response.ok ) return;
		const emotes = await response.json();
		if ( !emotes?.data ) return;
		return objectToMap( emotes.data );
	}

	const processEventQueue = () =>
	{
		// Wait for animation to end
		if ( isAnimating || eventQueue.length === 0 ) return;

		const nextEvent = eventQueue[0];
		log( nextEvent.type );

		// Trigger animation
		setIsAnimating( true );
		if ( nextEvent.type === 'rewardemoterain' )
			emoteRain();
		else if ( nextEvent.type === 'rewardemotetornado' )
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
	const emoteRain = async ( configParam?: any ) =>
	{
		// Basic config
		const config = {
			...configDefaults,
			...configParam
		};

		const numberOfEmotes = randomIntegerBetween( config.minEmotes, config.maxEmotes );

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
		const channelEmotes = await getEmotes();
		if ( !channelEmotes ) return;

		const emoteImages: Image[] = [];
		let emoteImagesLoaded = 0;
		channelEmotes.forEach( ( value, _key ) => {
			const image = new Image();
			if ( !value ) return;
			image.src = value;
			image.onload = () => { emoteImagesLoaded++ };
			emoteImages.push( image );
		});

		// Setup initial random vars for all emotes
		const emotes = [];
		for ( let i = 0; i < numberOfEmotes; i++ )
		{
			// Bigger angle = bigger swing
			const angle = randomIntegerBetween( config.maxSwingAngle / 2, config.maxSwingAngle );
			// Swing intensity = lower number means bigger swing
			const dir = [-1,1][ randomIntegerBetween( 0, config.maxSwingAngle / 10 ) ];
			// Velocity = y coord change per frame (something between 1 and 2 is good)
			const velocity = config.velocity / angle;

			emotes.push({
				x: randomIntegerBetween( 0, canvas.width - config.emoteSize / 2 ),
				y: randomIntegerBetween( canvas.height / 2 * -1, -100 ),
				w: config.emoteSize,
				h: config.emoteSize,
				v: velocity,
				a: angle,
				d: dir,
				i: sample( emoteImages )
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
						emotes[i].y = randomIntegerBetween( canvas.height / 2 * -1, -100 );
						emotes[i].x = randomIntegerBetween( 0, canvas.width - config.emoteSize / 2 );
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
			if ( channelEmotes.size !== emoteImagesLoaded ) return;
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
	const emoteTornado = async ( configParam?: any ) =>
	{
		const config = {
			...configDefaults,
			...configParam
		};

		const numberOfElements = randomIntegerBetween( config.minEmotes, config.maxEmotes );

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

		const emoteImages = await getEmotes();
		if ( !emoteImages ) return;

		// Actually create all emote elements
		for( let i = 1; i <= numberOfElements; i++ )
		{
			// Create new emote
			const emote = document.createElement( 'img' );
			emote.id = `propzEmote-${i}`;
			emote.classList.add( 'propzEmote' );
			//emote.innerHTML = '🎉';
			emote.src = sample( [...emoteImages.values()] );

			// Randomize Animation stuff
			emote.style.left = `${ randomIntegerBetween( 0, 100 ) }%`;
			emote.style.transform = `translateY(-${ config.emoteSize * config.emoteSize }px)`;
			emote.style.animationDelay = `${ randomIntegerBetween( 0, 3000 ) }ms`;
			emote.style.animationDuration = `${ randomIntegerBetween( 0, 5000 ) + 15000 }ms`;

			emotesWrapper.appendChild( emote );
		}
	}

	return '';
}

export default EmoteEffects;
