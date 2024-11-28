/**
 * Emote Effects
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

const EmoteEffects = ( propz ) =>
{
	/**
	 * Default Config values
	 */
	const configDefaults = {
		minEmotes: 50,
		maxEmotes: 100,
		emoteSize: 100,
		infinite: false,
		velocity: 25,
		maxSwingAngle: 25,
		emoteImages: [
			'https://streambot.propz.de/assets/emote-propzm-dumm.png',
			'https://streambot.propz.de/assets/emote-propzm-hype.png',
			'https://streambot.propz.de/assets/emote-propzm-murks.png',
			'https://streambot.propz.de/assets/emote-propzm-propz.png',
			'https://streambot.propz.de/assets/emote-propzm-why-112.png',
			'https://streambot.propz.de/assets/emote-propzm-spinner.gif'
		]
	}	

	/**
	 * Make Emotes Rain.
	 * 
	 * Animation by Nelson Rodriques:
	 * https://codepen.io/nelsonr/pen/NEvyWv
	 * 
	 * @param {Object} configParam - Contains the rain config.
	 * @returns {void}
	 */
	const emoteRain = async ( configParam ) =>
	{
		// Basic config
		const config = {
			...configDefaults,
			...configParam
		};

		const getRandomNumber = ( max = 1, min = 0 ) => Math.floor( Math.random() * ( max - min ) ) + min;
		const numberOfEmotes = getRandomNumber( config.maxEmotes, config.minEmotes );

		// Create Canvas + some Settings
		const canvas = document.createElement( 'canvas' );
		canvas.width = Math.max( document.documentElement.clientWidth || 0, window.innerWidth || 0 );
		canvas.height = Math.max( document.documentElement.clientHeight || 0, window.innerHeight || 0 );
		// Universal styles
		canvas.style.position = 'fixed';
		canvas.style.top = 0;
		canvas.style.left = 0;
		canvas.style.width = '100vw';
		canvas.style.height = '100vh';
		canvas.style.zIndex = 100;

		document.body.appendChild( canvas );

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

		/**
		 * Setup initial random vars for all emotes
		 */
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

		/**
		 * Called every frame
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

		/**
		 * Actually draw the stuff
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


	/**
	 * Make the Emote Tornado.
	 * 
	 * Animation by Yusuke Nakaya:
	 * https://codepen.io/YusukeNakaya/pen/yzNBpM
	 * 
	 * @param {Object} configParam - Contains the rain config.
	 * @returns {void}
	 */
	const emoteTornado = ( configParam ) =>
	{
		const config = {
			...configDefaults,
			...configParam
		};
		
		const getRandomNumber = ( max = 1, min = 0 ) => Math.floor( Math.random() * ( max - min ) ) + min;
		const numberOfElements = getRandomNumber( config.maxEmotes, config.minEmotes );
		
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
		document.body.appendChild( emotesWrapper );

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

	return { emoteRain, emoteTornado }
}

export default EmoteEffects;