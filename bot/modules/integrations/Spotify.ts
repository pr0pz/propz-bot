/**
 * Spotify
 *
 * https://developer.spotify.com/documentation/web-api/concepts/api-calls
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';

import type {} from '@types/spotify-api';
import type { SpotifyTokenData } from '@shared/types.ts';

export class Spotify
{
	private skipNextTrack = 0;

	constructor() {}

	private static get apiUrl() { return 'https://api.spotify.com/v1' }
	private static get authUrl() { return 'https://accounts.spotify.com/api/token' }
	private static get playlistBanger() { return '7zVD6GFNSJQv7aenpcKIrr' }
	private static get spotifyClientId() { return Deno.env.get( 'SPOTIFY_CLIENT_ID' ) || '' }
	private static get spotifyClientSecret() { return Deno.env.get( 'SPOTIFY_CLIENT_SECRET' ) || '' }
	private static get spotifyInitialOauthCode() { return Deno.env.get( 'SPOTIFY_INITIAL_OAUTH_CODE' ) || '' }

	/**
	 * Get initial access token from Spotify
	 *
	 * @returns
	 */
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

	/**
	 * Refresh Spotify token
	 *
	 * @param tokenData SpotifyTokenData
	 * @returns
	 */
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

	/**
	 * Get current spotify token data.
	 * Is created here if it doesn't exist.
	 *
	 * @returns
	 */
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
				const newTokenData = await Spotify.refreshAccessToken( tokenData );
				return newTokenData;
			}

			return tokenData;
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	/**
	 * Save token to Database
	 *
	 * @param tokenData
	 */
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

	/**
	 * Get current playing Song
	 *
	 * @returns String
	 */
	public static async getCurrentSong(): Promise<string>
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const response = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );

			const result = await response.json() as SpotifyApi.CurrentlyPlayingResponse;
			if ( !result?.item ) return '';

			const track = result.item as SpotifyApi.TrackObjectFull;
			const artist = Spotify.getArtist( track.artists as SpotifyApi.ArtistObjectSimplified[] );

			return `${artist} - ${track.name} › ${track.external_urls.spotify}`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	/**
	 * Get current playlist
	 *
	 * @returns
	 */
	public static async getCurrentPlaylist(): Promise<string>
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			// Current Track info
			const currentPlaying = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );
			const currentPlayingResponse = await currentPlaying.json() as SpotifyApi.CurrentlyPlayingResponse;
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

	/**
	 * Add Song to banger playlist
	 *
	 * @returns
	 */
	public static async addBangerToPlaylist()
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			// Current Track info
			const currentPlaying = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );
			const currentPlayingResponse = await currentPlaying.json() as SpotifyApi.CurrentlyPlayingResponse;

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

	/**
	 * Add Song to queue
	 *
	 * @param trackUrl
	 * @returns
	 */
	public static async addToQueue( trackUrl: string )
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';
		const trackUrlInfo = trackUrl.match( /track\/(\w+)\??/i );
		if ( !trackUrlInfo?.[1] ) return '';
		const trackUri = encodeURIComponent( `spotify:track:${trackUrlInfo[1]}` );

		try
		{
			const addToQueue = await fetch( `${Spotify.apiUrl}/me/player/queue?uri=${trackUri}`, {
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

			return this.getTrack( trackUrlInfo[1] );
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	/**
	 * Get Single track name
	 * @param trackId
	 * @returns
	 */
	private static async getTrack( trackId: string ): Promise<string>
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const track = await fetch( `${Spotify.apiUrl}/tracks/${trackId}`, { headers: headers } );

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
			return `${artist} - ${trackResponse.name}`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	/**
	 * Get auth header for every request
	 *
	 * @returns
	 */
	private static async getAuthHeaders(): Promise<Headers | null>
	{
		const tokenData = await Spotify.getTokenData();
		if ( !tokenData?.access_token ) return null;
		return new Headers( { Authorization: `Bearer ${tokenData.access_token}` } );
	}

	/**
	 * Return name of all track artists
	 *
	 * @param artists
	 * @returns
	 */
	private static getArtist( artists: SpotifyApi.ArtistObjectSimplified[] ): string
	{
		return artists.map( ( artist ) => artist.name ).join( ' feat. ' );
	}

	/**
	 * Skips the playback to the next track.
	 */
	public async skipToNext(): Promise<string>
	{
		if ( this.skipNextTrack === 0 )
		{
			this.skipNextTrack++;
			return 'One more vote to skip the Song.';
		}
		this.skipNextTrack = 0;

		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			void await fetch( `${Spotify.apiUrl}/me/player/next`, { headers: headers } );
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}
}
