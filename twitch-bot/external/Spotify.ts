/**
 * Spotify
 *
 * https://developer.spotify.com/documentation/web-api/concepts/api-calls
 *
 * @author Wellington Estevo
 * @version 1.7.6
 */

import { log } from '@propz/helpers.ts';
import type {} from '@types/spotify-api';
import type { SpotifyTokenData } from '@propz/types.ts';
import type { Database } from '../bot/Database.ts';

export class Spotify
{
	private apiUrl = 'https://api.spotify.com/v1';
	private authUrl = 'https://accounts.spotify.com/api/token';
	private spotifyClientId;
	private spotifyClientSecret;
	private spotifyInitialOauthCode;
	private playlistBanger = '7zVD6GFNSJQv7aenpcKIrr';

	constructor( private db: Database )
	{
		this.spotifyClientId = Deno.env.get( 'SPOTIFY_CLIENT_ID' ) || '';
		this.spotifyClientSecret = Deno.env.get( 'SPOTIFY_CLIENT_SECRET' ) || '';
		this.spotifyInitialOauthCode = Deno.env.get( 'SPOTIFY_INITIAL_OAUTH_CODE' ) || '';
		db.query( `INSERT OR IGNORE INTO auth (name, data) VALUES ('spotify', '')` );
	}

	/**
	 * Get initial access token from Spotify
	 *
	 * @returns
	 */
	private async getAccessToken(): Promise<SpotifyTokenData | null>
	{
		if (
			!this.spotifyClientId ||
			!this.spotifyClientSecret ||
			!this.spotifyInitialOauthCode
		) return null;

		try
		{
			const body = new URLSearchParams( {
				grant_type: 'authorization_code',
				code: this.spotifyInitialOauthCode,
				redirect_uri: 'https://propz.tv'
			} );

			const response = await fetch( this.authUrl, {
				headers: new Headers( {
					Authorization: `Basic ${btoa( this.spotifyClientId + ':' + this.spotifyClientSecret )}`,
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
			this.saveTokenData( newTokenData );
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
	private async refreshAccessToken( tokenData: SpotifyTokenData ): Promise<SpotifyTokenData | null>
	{
		if (
			!this.spotifyClientId ||
			!this.spotifyClientSecret ||
			!this.spotifyInitialOauthCode
		) return null;

		try
		{
			const response = await fetch( this.authUrl, {
				headers: new Headers( {
					Authorization: `Basic ${btoa( this.spotifyClientId + ':' + this.spotifyClientSecret )}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				} ),
				method: 'post',
				body: new URLSearchParams( {
					grant_type: 'refresh_token',
					refresh_token: tokenData.refresh_token,
					client_id: this.spotifyClientId
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
			this.saveTokenData( newTokenData );
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
	private async getTokenData(): Promise<SpotifyTokenData | null>
	{
		try
		{
			const results = this.db.queryEntries( `SELECT data FROM auth WHERE name = 'spotify'` );
			// Doesn't exist, so get it first time
			if ( !results?.[0]?.['data'] ) return this.getAccessToken();

			const tokenData = JSON.parse( results?.[0]?.['data'] as string ) as SpotifyTokenData || '';

			// Refresh
			if ( tokenData.expires_at <= Date.prototype.timestamp() )
			{
				const newTokenData = await this.refreshAccessToken( tokenData );
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
	private saveTokenData( tokenData: SpotifyTokenData )
	{
		try
		{
			this.db.query(
				`UPDATE auth SET data = ? WHERE name = 'spotify'`,
				[ JSON.stringify( tokenData, null, '\t' ) ]
			);
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/**
	 * Get current playing Song
	 *
	 * @returns String
	 */
	public async getCurrentSong(): Promise<string>
	{
		const headers = await this.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const response = await fetch( `${this.apiUrl}/me/player/currently-playing`, { headers: headers } );

			const result = await response.json() as SpotifyApi.CurrentlyPlayingResponse;
			if ( !result?.item ) return '';

			const track = result.item as SpotifyApi.TrackObjectFull;
			const artist = this.getArtist( track.artists as SpotifyApi.ArtistObjectSimplified[] );

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
	public async getCurrentPlaylist(): Promise<string>
	{
		const headers = await this.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			// Current Track info
			const currentPlaying = await fetch( `${this.apiUrl}/me/player/currently-playing`, { headers: headers } );
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
	public async addBangerToPlaylist()
	{
		const headers = await this.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			// Current Track info
			const currentPlaying = await fetch( `${this.apiUrl}/me/player/currently-playing`, { headers: headers } );
			const currentPlayingResponse = await currentPlaying.json() as SpotifyApi.CurrentlyPlayingResponse;

			if ( !currentPlayingResponse?.item ) return 'Error › No Song is playing or what';
			const track = currentPlayingResponse.item as SpotifyApi.TrackObjectFull;
			const artist = this.getArtist( track.artists as SpotifyApi.ArtistObjectSimplified[] );

			// Add to Playlist
			const addToBanger = await fetch(
				`${this.apiUrl}/playlists/${this.playlistBanger}/tracks`,
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
	public async addToQueue( trackUrl: string )
	{
		const headers = await this.getAuthHeaders();
		if ( !headers ) return '';
		const trackUrlInfo = trackUrl.match( /track\/(\w+)\??/i );
		if ( !trackUrlInfo?.[1] ) return '';
		const trackUri = encodeURIComponent( `spotify:track:${trackUrlInfo[1]}` );

		try
		{
			const addToQueue = await fetch( `${this.apiUrl}/me/player/queue?uri=${trackUri}`, {
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
	private async getTrack( trackId: string ): Promise<string>
	{
		const headers = await this.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const track = await fetch( `${this.apiUrl}/tracks/${trackId}`, { headers: headers } );

			const trackResponse = await track.json();
			if ( !track.ok && trackResponse.error )
			{
				const errorMessage = trackResponse.error.message ?
					`${trackResponse.error.message} (${trackResponse.error.status})` :
					trackResponse.error;
				log( new Error( `Error: ${errorMessage}` ) );
				return '';
			}

			const artist = this.getArtist( trackResponse.artists as SpotifyApi.ArtistObjectSimplified[] );
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
	private async getAuthHeaders(): Promise<Headers | null>
	{
		const tokenData = await this.getTokenData();
		if ( !tokenData?.access_token ) return null;
		return new Headers( { Authorization: `Bearer ${tokenData.access_token}` } );
	}

	/**
	 * Return name of all track artists
	 *
	 * @param artists
	 * @returns
	 */
	private getArtist( artists: SpotifyApi.ArtistObjectSimplified[] ): string
	{
		return artists.map( ( artist ) => artist.name ).join( ' feat. ' );
	}
}
