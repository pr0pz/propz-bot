/**
 * Spotify Ad Muter
 * 
 * @author Wellington Estevo
 * @version 1.0.9
 */

import { execCommand, log } from '@shared/helpers.ts';

export default class SpotifyAdMuter
{
	checkInterval = 500;
	originalVolume = 0;
	isPlayingAd = false;
	isPlayingMusic = false;

	constructor()
	{
		this.originalVolume = this.getSpotifyVolume();
	}

	isSpotifyRunning()
	{
		try
		{
			const stdout = execCommand( 'pgrep', [ '-x', 'Spotify' ] );
			return stdout.length > 0;
		}
		catch
		{
			return false;
		}
	}

	getCurrentTrackType()
	{
		try
		{
			const stdout = execCommand( 'osascript', [ '-e', 'tell application "Spotify" to get spotify url of current track' ] );
			// Spotify URLs are formatted like "spotify:track:..." or "spotify:ad:..."
			const type = stdout.split(':')[1];
			return type || 'unknown';
		}
		catch
		{
			return 'unknown';
		}
	}

	setSpotifyVolume( volume: number )
	{
		try
		{
			const stdout = execCommand( 'osascript', [ '-e', `tell application "Spotify" to set sound volume to ${volume}` ] );
			return parseInt( stdout, 10 );
		}
		catch
		{
			return null;
		}
	}

	getSpotifyVolume()
	{
		try
		{
			const stdout = execCommand( 'osascript', [ '-e', 'tell application "Spotify" to set A to sound volume' ] );
			return parseInt( stdout.trim(), 10 );
		}
		catch
		{
			return 0;
		}
	}

	handleAd()
	{
		if ( !this.isPlayingAd )
		{
			this.isPlayingAd = true;
			this.isPlayingMusic = false;
			this.setSpotifyVolume( 2 );
			log( '🔇 ad muted' );
		}
	}

	handleSong()
	{
		if ( !this.isPlayingMusic )
		{
			this.isPlayingAd = false;
			this.isPlayingMusic = true;
			this.setSpotifyVolume( this.originalVolume );
			log( '🔈 Playing music' );
		}
	}

	checkSpotify = () =>
	{
		const trackType = this.getCurrentTrackType();
		
		if ( trackType === 'ad' )
			this.handleAd();
		else
			this.handleSong();

		if ( !this.isSpotifyRunning() )
		{
			log( new Error( 'Spotify was closed, waiting for restart...' ) );
			setTimeout( () => this.start(), 30000 );
			return;
		}

		setTimeout( this.checkSpotify, this.checkInterval );
	}

	start()
	{
		if ( !this.isSpotifyRunning() )
		{
			log( new Error( 'Spotify not running' ) );
			setTimeout( () => this.start(), 30000 );
			return;
		}

		this.checkSpotify();
	}
}
