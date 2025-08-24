/**
 * Spotify
 *
 * https://developer.spotify.com/documentation/web-api/concepts/api-calls
 *
 * @author Wellington Estevo
 * @version 1.7.1
 */

import { log } from '@propz/helpers.ts';
import '@types/spotify-api';
import type { SpotifyTokenData } from '@propz/types.ts';
import type { Database } from '../bot/Database.ts';

export class Spotify
{
	private apiUrl = 'https://api.spotify.com/v1';
	private authUrl = 'https://accounts.spotify.com/api/token';
	private spotifyClientId;
	private spotifyClientSecret;
	private spotifyInitialOauthCode;

	constructor( private db: Database )
	{
		this.spotifyClientId = Deno.env.get( 'SPOTIFY_CLIENT_ID' ) || '';
		this.spotifyClientSecret = Deno.env.get( 'SPOTIFY_CLIENT_SECRET' ) || '';
		this.spotifyInitialOauthCode = Deno.env.get( 'SPOTIFY_INITIAL_OAUTH_CODE' ) || '';
	}

	/**
	 * Get initial access token from Spotify
	 *
	 * @returns
	 */
	private async getAccessToken(): Promise<SpotifyTokenData | null>
	{
		if ( !this.spotifyClientId || !this.spotifyClientSecret || !this.spotifyInitialOauthCode ) return null;

		try
		{
			const response = await fetch( this.authUrl, {
				headers: new Headers( {
					Authorization: `Basic ${btoa( this.spotifyClientId + ':' + this.spotifyClientSecret )}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				} ),
				method: 'post',
				body: new URLSearchParams( {
					grant_type: 'authorization_code',
					code: this.spotifyInitialOauthCode,
					redirect_uri: `https://propz.tv`
				} )
			} );

			const newTokenData = await response.json();
			if ( newTokenData?.error )
			{
				const errorMessage = newTokenData.error.message ?
					`${newTokenData.error.message} (${newTokenData.error.status})` :
					newTokenData.error;
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
		if ( !this.spotifyClientId || !this.spotifyClientSecret || !this.spotifyInitialOauthCode ) return null;

		try
		{
			const response = await fetch( this.authUrl, {
				headers: new Headers( {
					'Content-Type': 'application/x-www-form-urlencoded'
				} ),
				method: 'post',
				body: new URLSearchParams( {
					grant_type: 'refresh_token',
					code: tokenData.refresh_token,
					client_id: this.spotifyClientId
				} )
			} );

			const newTokenData = await response.json();
			if ( newTokenData.error )
			{
				const errorMessage = newTokenData.error.message ?
					`${newTokenData.error.message} (${newTokenData.error.status})` :
					newTokenData.error;
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
				`INSERT INTO auth (name, data) 
				VALUES ('spotify', ?)
				ON CONFLICT(name) DO
					UPDATE SET data = ?
					WHERE name = 'spotify'`,
				[
					JSON.stringify( tokenData, null, '\t' )
				]
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
		const tokenData = await this.getTokenData();
		if ( !tokenData?.access_token ) return '';

		try
		{
			const response = await fetch( `${this.apiUrl}/me/player/currently-playing`, {
				headers: new Headers( {
					Authorization: `Bearer ${tokenData.access_token}`
				} )
			} );

			const result = await response.json() as SpotifyApi.CurrentlyPlayingResponse;
			if ( !result?.item ) return '';

			const track = result.item as SpotifyApi.TrackObjectFull;
			const artist = track.artists.join( ' feat. ' );

			return `${artist} - ${track.name} › ${track.external_urls.spotify}`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	public addToPlaylist()
	{
	}

	public getCurrentPlaylistUrl()
	{
	}

	public addSongToQueue()
	{
	}
}
