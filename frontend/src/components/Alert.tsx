/**
 * Single ALert
 *
 * @author Wellington Estevo
 * @version 1.8.4
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '../../../shared/helpers.ts';
import Window from './Window.tsx';

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

	// Reset Playstate
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
			getAudio( propz.text ).then( (tts) =>
			{
				if ( !tts ) return;

				setTts( tts );
				setTtsPlaystate( true );

				//tts.pause();
				//tts.load();
				void tts.play();

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

	/**
	 *
	 * Filiz, Astrid, Tatyana, Maxim, Carmen, Ines, Cristiano, Vitoria, Ricardo, Maja, Jan, Jacek, Ewa, Ruben, Lotte, Liv, Seoyeon, Takumi, Mizuki, Giorgio, Carla, Bianca, Karl, Dora, Mathieu, Celine, Chantal, Penelope, Miguel, Mia, Enrique, Conchita, Geraint, Salli, Matthew, Kimberly, Kendra, Justin, Joey, Joanna, Ivy, Raveena, Aditi, Emma, Brian, Amy, Russell, Nicole, Vicki, Marlene, Hans, Naja, Mads, Gwyneth, Zhiyu, es-ES-Standard-A, it-IT-Standard-A, it-IT-Wavenet-A, ja-JP-Standard-A, ja-JP-Wavenet-A, ko-KR-Standard-A, ko-KR-Wavenet-A, pt-BR-Standard-A, tr-TR-Standard-A, sv-SE-Standard-A, nl-NL-Standard-A, nl-NL-Wavenet-A, en-US-Wavenet-A, en-US-Wavenet-B, en-US-Wavenet-C, en-US-Wavenet-D, en-US-Wavenet-E, en-US-Wavenet-F, en-GB-Standard-A, en-GB-Standard-B, en-GB-Standard-C, en-GB-Standard-D, en-GB-Wavenet-A, en-GB-Wavenet-B, en-GB-Wavenet-C, en-GB-Wavenet-D, en-US-Standard-B, en-US-Standard-C, en-US-Standard-D, en-US-Standard-E, de-DE-Standard-A, de-DE-Standard-B, de-DE-Wavenet-A, de-DE-Wavenet-B, de-DE-Wavenet-C, de-DE-Wavenet-D, en-AU-Standard-A, en-AU-Standard-B, en-AU-Wavenet-A, en-AU-Wavenet-B, en-AU-Wavenet-C, en-AU-Wavenet-D, en-AU-Standard-C, en-AU-Standard-D, fr-CA-Standard-A, fr-CA-Standard-B, fr-CA-Standard-C, fr-CA-Standard-D, fr-FR-Standard-C, fr-FR-Standard-D, fr-FR-Wavenet-A, fr-FR-Wavenet-B, fr-FR-Wavenet-C, fr-FR-Wavenet-D, da-DK-Wavenet-A, pl-PL-Wavenet-A, pl-PL-Wavenet-B, pl-PL-Wavenet-C, pl-PL-Wavenet-D, pt-PT-Wavenet-A, pt-PT-Wavenet-B, pt-PT-Wavenet-C, pt-PT-Wavenet-D, ru-RU-Wavenet-A, ru-RU-Wavenet-B, ru-RU-Wavenet-C, ru-RU-Wavenet-D, sk-SK-Wavenet-A, tr-TR-Wavenet-A, tr-TR-Wavenet-B, tr-TR-Wavenet-C, tr-TR-Wavenet-D, tr-TR-Wavenet-E, uk-UA-Wavenet-A, ar-XA-Wavenet-A, ar-XA-Wavenet-B, ar-XA-Wavenet-C, cs-CZ-Wavenet-A, nl-NL-Wavenet-B, nl-NL-Wavenet-C, nl-NL-Wavenet-D, nl-NL-Wavenet-E, en-IN-Wavenet-A, en-IN-Wavenet-B, en-IN-Wavenet-C, fil-PH-Wavenet-A, fi-FI-Wavenet-A, el-GR-Wavenet-A, hi-IN-Wavenet-A, hi-IN-Wavenet-B, hi-IN-Wavenet-C, hu-HU-Wavenet-A, id-ID-Wavenet-A, id-ID-Wavenet-B, id-ID-Wavenet-C, it-IT-Wavenet-B, it-IT-Wavenet-C, it-IT-Wavenet-D, ja-JP-Wavenet-B, ja-JP-Wavenet-C, ja-JP-Wavenet-D, cmn-CN-Wavenet-A, cmn-CN-Wavenet-B, cmn-CN-Wavenet-C, cmn-CN-Wavenet-D, nb-no-Wavenet-E, nb-no-Wavenet-A, nb-no-Wavenet-B, nb-no-Wavenet-C, nb-no-Wavenet-D, vi-VN-Wavenet-A, vi-VN-Wavenet-B, vi-VN-Wavenet-C, vi-VN-Wavenet-D, sr-rs-Standard-A, lv-lv-Standard-A, is-is-Standard-A, bg-bg-Standard-A, af-ZA-Standard-A, Tracy, Danny, Huihui, Yaoyao, Kangkang, HanHan, Zhiwei, Asaf, An, Stefanos, Filip, Ivan, Heidi, Herena, Kalpana, Hemant, Matej, Andika, Rizwan, Lado, Valluvar, Linda, Heather, Sean, Michael, Karsten, Guillaume, Pattara, Jakub, Szabolcs, Hoda, Naayf
	 *
	 * @param {String} text
	 * @param {String} voice
	 */
	const getAudio = async ( text: string = '', voice: string = 'de-DE-Wavenet-C' ) =>
	{
		if ( !text ) return;

		const url = `https://api.streamelements.com/kappa/v2/speech?voice=${ voice }&text=${ encodeURIComponent( text.trim() ) }`;
		try
		{
			const speak = await fetch( url );
			if ( speak.status !== 200 ) return;

			const mp3 = await speak.blob();
			const blobUrl = URL.createObjectURL( mp3 );

			return new Audio( blobUrl );
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
