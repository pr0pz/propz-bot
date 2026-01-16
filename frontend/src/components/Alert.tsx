import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import { log } from '@shared/helpers.ts';
import Window from '@components/Window.tsx';

const Alert = ( propz: {
	type: string;
	text?: string;
	noAudio: boolean;
	audio: string;
	color: string;
	title: string;
	count: number;
	user: string;
	profilePictureUrl?: string;
	key: string;
	media: string;
} ) =>
{
	const event = useEvent() as CustomEvent;
	const [tts, setTts] = useState( null );
	const [ttsPlaystate, setTtsPlaystate] = useState( false );

	let alertType = propz.type;
	if ( alertType.startsWith( 'chatscore' ) )
		alertType = 'chatscore';

	// Reset Playstate - Security: harter Abbruch bei Bedarf
	useEffect( () =>
	{
		if (
			event?.detail?.type !== 'command' &&
			event?.detail?.text !== 'clear'
		) return;

		setTtsPlaystate( false );
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps

	// Stop audio on playstate change
	useEffect(() =>
	{
		if (
			!tts ||
			ttsPlaystate
		) return;

		tts.pause();
		tts.currentTime = 0;
	},
	// eslint-disable-next-line
	[ttsPlaystate]);

	// Play audio when the component mounts
	useEffect(() =>
	{
		// TTS
		if ( propz?.text )
		{
			getAudio( propz.text ).then( (ttsAudio) =>
			{
				if ( !ttsAudio ) return;

				setTts( ttsAudio );
				setTtsPlaystate( true );

				//ttsAudio.pause();
				//ttsAudio.load();
				void ttsAudio.play();

				setTimeout( () =>
				{
					setTtsPlaystate( false );
				}, 10000 );
			});
		}

		// Alert Audio Sound
		if ( propz?.noAudio ) return;

		const audioFile = `/alerts/${propz.audio}`;
		let audio;
		try {
			audio = new Audio( audioFile );
			audio.volume = 0.2;
			audio.loop = false;
			//audio.pause();
			//audio.load();
			audio.play();
		}
		catch ( error: unknown ) { log( error ) }

		// Cleanup: Pause and reset audio when the component is unmounted
		return () =>
		{
			/*if ( audio )
			{
				//audio.pause();
				audio.currentTime = 0;
			}*/
		};
	},
	// eslint-disable-next-line
	[]);

	/**
	 * Split username in letters for animation.
	 *
	 * @param {string} userName
	 */
	const splitUpUsername = ( userName: string ) =>
	{
		const userNameLetter = userName.split('');
		const userNameSplitted = userNameLetter.map( ( letter, index ) => {
			return <span className="animate-letter" style={ { color: propz.color } } key={ index }>{ letter }</span>
		});

		return <>{userNameSplitted}</>;
	}

	const getAudio = async ( text: string = '' ) =>
	{
		if ( !text ) return;
		let urlPrefix = 'https';
		if ( process.env.BOT_URL.includes( 'localhost' ) || process.env.BOT_URL.includes( '127.0.0.1' ) )
			urlPrefix = 'http';

		try
		{
			const response = await fetch( `${ urlPrefix }://${ process.env.BOT_URL }/api`, {
				body: JSON.stringify(
					{
						request: 'generateTts',
						data: {
							text: text
						}
					} satisfies {
						request: string,
						data: {
							text: string
						}
					}
				),
				method: 'POST',
			} );

			if ( !response.ok ) return;
			const mp3 = await response.json();
			return new Audio( mp3.data );
		}
		catch( error: unknown ) { log( error ) }
	}

	// Dont do anything if no title given, probably just TTS
	if ( !propz?.type || !propz?.title ) return;

	return(
		<div id="alert" className={ `alert alert-${ alertType } ${ propz.text ? 'has-text' : '' }` }>
			<div id="alert-media">
				{ propz.media && propz.media.includes( '.gif' ) && <img src={ `/alerts/${ propz.media }` }  alt={ propz.title }/> }
				{ propz.media && propz.media.includes( '.webm' ) && <video src={ `/alerts/${ propz.media }` } autoPlay playsInline muted loop preload="auto" onLoadedData={(e) => e.currentTarget.play()}></video> }
			</div>

			{ propz.count > 0 &&
				<div id="alert-count">{ propz.count }x</div>
			}

			<div className="alert-title-wrapper">
				<Window id="alert-title">{ propz.title }</Window>
			</div>

			{ propz.user &&
				<>
					<div className="alert-user-wrapper">
						<Window id="alert-title" theme="dark">{ splitUpUsername( propz.user ) }</Window>
					</div>
					{ propz.profilePictureUrl &&
						<div id="alert-avatar">
							<img src={ propz.profilePictureUrl } alt={ propz.user } />
						</div>
					}
				</>
			}
			{ propz.text &&
				<div className="alert-text-wrapper">
					<div id="alert-text">
						{ propz.text }
					</div>
				</div>
			}
			<div id="alert-background"></div>
		</div>
	)
}

export default Alert;
