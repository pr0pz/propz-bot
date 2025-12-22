/**
 * Spotify
 *
 * https://developer.spotify.com/documentation/web-api/concepts/api-calls
 *
 * @author Wellington Estevo
 * @version 2.1.4
 */

import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';

import type {} from '@types/spotify-api';
import type { SimpleUser, SpotifyQueueTrack, SpotifyTokenData } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class Spotify
{
	private skipNextTrack = '';
	private currentTrack: SpotifyQueueTrack | null = null;
	private queue: SpotifyQueueTrack[] = [];

	constructor( private twitch: Twitch )
	{
		setInterval( () => this.cleanUpQueue(), 15000 );
	}

	private static get apiUrl() { return 'https://api.spotify.com/v1' }
	private static get authUrl() { return 'https://accounts.spotify.com/api/token' }
	private static get trackUrl() { return 'https://open.spotify.com/track/' }
	private static get playlistBanger() { return '7zVD6GFNSJQv7aenpcKIrr' }
	private static get spotifyClientId() { return Deno.env.get( 'SPOTIFY_CLIENT_ID' ) || '' }
	private static get spotifyClientSecret() { return Deno.env.get( 'SPOTIFY_CLIENT_SECRET' ) || '' }
	private static get spotifyInitialOauthCode() { return Deno.env.get( 'SPOTIFY_INITIAL_OAUTH_CODE' ) || '' }

	public static async addBangerToPlaylist()
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			// Current Track info
			const currentPlaying = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );
			if ( !currentPlaying.ok || currentPlaying.status === 204 ) return 'Error › No Song is playing or what';

			const text = await currentPlaying.text();
			if ( !text ) return 'Error › No Song is playing or what';

			const currentPlayingResponse = JSON.parse( text ) as SpotifyApi.CurrentlyPlayingResponse;

			if ( !currentPlayingResponse?.item ) return 'Error › No Song is playing or what';
			const track = currentPlayingResponse.item as SpotifyApi.TrackObjectFull;
			const artist = Spotify.getArtist( track.artists as SpotifyApi.ArtistObjectSimplified[] );

			// Add to Playlist
			const addToBanger = await fetch(
				`${Spotify.apiUrl}/playlists/${Spotify.playlistBanger}/tracks`,
				{
					headers: headers,
					body: JSON.stringify( {
						position: 0,
						uris: [ track.uri ]
					} ),
					method: 'post'
				}
			);
			const addToBangerResponse = await addToBanger.json();
			if ( !addToBanger.ok && addToBangerResponse.error )
			{
				log( new Error( `Error: ${addToBangerResponse.error.message} (${addToBangerResponse.error.status})` ) );
				return `Error › Couldn't add Track to Bangers`;
			}

			return `${artist} - ${track.name}`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	public async addToQueue( trackUrl: string, user: SimpleUser )
	{
		const trackUrlInfo = trackUrl.match( /track\/(\w+)\??/i );
		const trackId = trackUrlInfo?.[1] || '';
		if ( !trackId ) return '';

		if (
			this.queue.find( (track) => track.trackId === trackId ) ||
			await this.getCurrentTrackId() === trackId
		) return 'Track already in queue';

		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const addToQueue = await fetch( `${Spotify.apiUrl}/me/player/queue?uri=${ encodeURIComponent( `spotify:track:${trackId}` ) }`, {
				headers: headers,
				method: 'post'
			} );

			if ( !addToQueue.ok )
			{
				const addToQueueResponse = await addToQueue.json();
				const errorMessage = addToQueueResponse.error.message ?
					`${addToQueueResponse.error.message} (${addToQueueResponse.error.status})` :
					addToQueueResponse.error;
				log( new Error( `Error: ${errorMessage}` ) );
				return 'Error › Couldn\'t add song to queue';
			}

			const trackName = await Spotify.getTrack( trackId );

			this.queue.push({
				userName: user.displayName,
				trackName: trackName,
				trackId: trackId
			});

			return `@${ user.displayName } added "${trackName}" to the queue`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	private async cleanUpQueue(): Promise<void>
	{
		const currentTrack = await this.getCurrentTrackObject() as SpotifyApi.TrackObjectFull | null;
		if ( !currentTrack?.id ) return;

		if ( !this.queue.length && this.currentTrack?.trackId !== currentTrack.id )
		{
			this.currentTrack = {
				trackId: currentTrack.id,
				trackName: Spotify.getTrackName( Spotify.getArtist( currentTrack.artists ), currentTrack.name )
			};
			return;
		}

		for ( const [_index, track] of this.queue.entries() )
		{
			if ( currentTrack.id !== track.trackId ) continue;
			this.currentTrack = track;
			this.removeTrackFromQueue( track.trackId );
		}
	}

	private static async getAccessToken(): Promise<SpotifyTokenData | null>
	{
		if (
			!Spotify.spotifyClientId ||
			!Spotify.spotifyClientSecret ||
			!Spotify.spotifyInitialOauthCode
		) return null;

		try
		{
			const body = new URLSearchParams( {
				grant_type: 'authorization_code',
				code: Spotify.spotifyInitialOauthCode,
				redirect_uri: 'https://propz.tv'
			} );

			const response = await fetch( Spotify.authUrl, {
				headers: new Headers( {
					Authorization: `Basic ${btoa( Spotify.spotifyClientId + ':' + Spotify.spotifyClientSecret )}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				} ),
				method: 'post',
				body: body
			} );

			const newTokenData = await response.json();
			if ( newTokenData?.error )
			{
				let errorMessage = newTokenData.error.message ?
					`${newTokenData.error.message} (${newTokenData.error.status})` :
					newTokenData.error;

				if ( newTokenData.error_description )
					errorMessage += ' - ' + newTokenData.error_description;

				log( new Error( `Error: ${errorMessage}` ) );
				return null;
			}

			// Get exact expire time
			newTokenData.expires_at = Date.prototype.timestamp() + newTokenData.expires_in;
			Spotify.saveTokenData( newTokenData );
			return newTokenData;
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	private static getArtist( artists: SpotifyApi.ArtistObjectSimplified[] ): string
	{
		return artists.map( ( artist ) => artist.name ).join( ' feat. ' );
	}

	public static async getCurrentPlaylist(): Promise<string>
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			// Current Track info
			const currentPlaying = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );
			if ( !currentPlaying.ok || currentPlaying.status === 204 ) return 'Playlist not found';

			const text = await currentPlaying.text();
			if ( !text ) return 'Playlist not found';

			const currentPlayingResponse = JSON.parse( text ) as SpotifyApi.CurrentlyPlayingResponse;
			if ( !currentPlayingResponse?.context?.href ) return 'Playlist not found';

			// Get playlist
			const currentPlaylist = await fetch(
				`${currentPlayingResponse.context.href}?fields=name,owner(display_name)`,
				{
					headers: headers
				}
			);
			const playlistResponse = await currentPlaylist.json() as SpotifyApi.PlaylistObjectFull;

			if ( !currentPlaylist.ok && playlistResponse.error )
			{
				const errorMessage = playlistResponse.error.message ?
					`${playlistResponse.error.message} (${playlistResponse.error.status})` :
					playlistResponse.error;
				log( new Error( `Error: ${errorMessage}` ) );
				return 'Error getting Playlist';
			}

			return `'${playlistResponse.name}' by '${playlistResponse.owner.display_name}' › ${currentPlayingResponse.context.external_urls.spotify}`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	public async getCurrentTrack(): Promise<string>
	{
		if ( this.currentTrack )
		{
			let trackName = this.currentTrack.userName ? '@' + this.currentTrack.userName + ': ' : '';
			trackName += Spotify.getTrackNameWithUrl( this.currentTrack.trackName, this.currentTrack.trackId );
			return trackName;
		}

		const currentTrack = await this.getCurrentTrackObject() as SpotifyApi.TrackObjectFull | null;
		if ( !currentTrack?.id ) return '';

		const artist = Spotify.getArtist( currentTrack.artists as SpotifyApi.ArtistObjectSimplified[] );

		return `${ Spotify.getTrackName( artist, currentTrack.name ) } > ${ Spotify.trackUrl }${ currentTrack.id }`;
	}

	public async getCurrentTrackId(): Promise<string>
	{
		const currentTrack = await this.getCurrentTrackObject() as SpotifyApi.TrackObjectFull | null;
		return currentTrack?.id ?? '';
	}

	public async getCurrentTrackObject()
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const response = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );
			if ( !response.ok || response.status === 204 ) return '';

			const text = await response.text();
			if ( !text ) return null;

			const result = JSON.parse( text ) as SpotifyApi.CurrentlyPlayingResponse;
			if ( !result?.item ) return null;

			return result.item as SpotifyApi.TrackObjectFull;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	public getQueuedTracks(): string
	{
		if ( !this.queue.length ) return 'Queue is empty. Add a Song with the "Song Request" Reward.';
		return this.queue.
			filter( (_track, index) => index < 3 ).
			map( (track, index) => `${ index + 1}. @${track.userName}: ${track.trackName}` ).
			join( ' ||| ' );
	}

	private static async getTokenData(): Promise<SpotifyTokenData | null>
	{
		try
		{
			const db = Database.getInstance()
			const results = db.queryEntries( `SELECT data FROM auth WHERE name = 'spotify'` );
			// Doesn't exist, so get it first time
			if ( !results?.[0]?.['data'] ) return Spotify.getAccessToken();

			const tokenData = JSON.parse( results?.[0]?.['data'] as string ) as SpotifyTokenData || '';

			// Refresh
			if ( tokenData.expires_at <= Date.prototype.timestamp() )
			{
				return await Spotify.refreshAccessToken( tokenData );
			}

			return tokenData;
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	private static async getTrack( trackUri: string ): Promise<string>
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const track = await fetch( `${Spotify.apiUrl}/tracks/${trackUri}`, { headers: headers } );

			const trackResponse = await track.json();
			if ( !track.ok && trackResponse.error )
			{
				const errorMessage = trackResponse.error.message ?
					`${trackResponse.error.message} (${trackResponse.error.status})` :
					trackResponse.error;
				log( new Error( `Error: ${errorMessage}` ) );
				return '';
			}

			const artist = Spotify.getArtist( trackResponse.artists as SpotifyApi.ArtistObjectSimplified[] );
			return Spotify.getTrackName( artist, trackResponse.name );
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	public static getTrackName( trackArtist: string, trackName: string ): string
	{
		if ( !trackArtist || !trackName ) return '';
		return `${trackArtist} - ${trackName}`;
	}

	public static getTrackNameWithUrl( trackName: string, trackId: string ): string
	{
		return `${ trackName } > ${ Spotify.trackUrl }${ trackId }`;
	}

	private static async getAuthHeaders(): Promise<Headers | null>
	{
		const tokenData = await Spotify.getTokenData();
		if ( !tokenData?.access_token ) return null;
		return new Headers( { Authorization: `Bearer ${tokenData.access_token}` } );
	}

	public getUserNextTrackQueuePosition( user: SimpleUser ): string
	{
		for( const [index, track] of this.queue.entries() )
		{
			if ( track.userName !== user.displayName ) continue;
			return `${index + 1}. @${ track.userName}: ${track.trackName}`;
		}
		return '';
	}

	private static async refreshAccessToken( tokenData: SpotifyTokenData ): Promise<SpotifyTokenData | null>
	{
		if (
			!Spotify.spotifyClientId ||
			!Spotify.spotifyClientSecret ||
			!Spotify.spotifyInitialOauthCode
		) return null;

		try
		{
			const response = await fetch( this.authUrl, {
				headers: new Headers( {
					Authorization: `Basic ${btoa( Spotify.spotifyClientId + ':' + Spotify.spotifyClientSecret )}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				} ),
				method: 'post',
				body: new URLSearchParams( {
					grant_type: 'refresh_token',
					refresh_token: tokenData.refresh_token,
					client_id: Spotify.spotifyClientId
				} )
			} );

			const newTokenData = await response.json();
			if ( newTokenData.error )
			{
				let errorMessage = newTokenData.error.message ?
					`${newTokenData.error.message} (${newTokenData.error.status})` :
					`${newTokenData.error}`;

				if ( newTokenData.error_description )
					errorMessage += ' - ' + newTokenData.error_description;

				log( new Error( `Error: ${errorMessage}` ) );
				return null;
			}

			// Get exact expire time
			newTokenData.refresh_token = tokenData.refresh_token;
			newTokenData.expires_at = Date.prototype.timestamp() + newTokenData.expires_in;
			Spotify.saveTokenData( newTokenData );
			return newTokenData;
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	private removeTrackFromQueue( trackId: string ): void
	{
		this.queue = this.queue.filter( track => !(track.trackId === trackId) );
	}

	private static saveTokenData( tokenData: SpotifyTokenData )
	{
		try
		{
			const db = Database.getInstance();
			db.query( `INSERT OR IGNORE INTO auth (name, data) VALUES ('spotify', '')` );
			db.query(
				`UPDATE auth SET data = ? WHERE name = 'spotify'`,
				[ JSON.stringify( tokenData, null, '\t' ) ]
			);
		}
		catch ( error: unknown ) { log( error ) }
	}

	public async skipToNext( userName: string ): Promise<string>
	{
		if (
			userName.toLowerCase() !== this.twitch.userHelper.twitchUser?.name.toLowerCase() &&
			this.skipNextTrack === ''
		)
		{
			this.skipNextTrack = userName;
			return 'One more vote to skip the Song.';
		}
		else if ( userName === this.skipNextTrack )
		{
			return '';
		}
		this.skipNextTrack = '';

		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const currentTrackUri = await this.getCurrentTrackId();
			void await fetch( `${Spotify.apiUrl}/me/player/next`, {
				headers: headers,
				method: 'post'
			} );
			this.removeTrackFromQueue( currentTrackUri );
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}
}
