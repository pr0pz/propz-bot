/**
 * Spotify
 *
 * https://developer.spotify.com/documentation/web-api/concepts/api-calls
 *
 * @author Wellington Estevo
 * @version 2.0.7
 */

import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';

import type {} from '@types/spotify-api';
import type { SimpleUser, SpotifyQueueTrack, SpotifyTokenData } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class Spotify
{
	private skipNextTrack = 0;
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

	public async addToQueue( trackUrl: string, user: SimpleUser )
	{
		const trackUrlInfo = trackUrl.match( /track\/(\w+)\??/i );
		if ( !trackUrlInfo?.[1] ) return '';
		const trackUri = encodeURIComponent( `spotify:track:${trackUrlInfo[1]}` );

		if (
			this.queue.find( (track) => track.trackUri === trackUri ) ||
			await this.getCurrentTrackUri() === trackUri
		) return 'Track already in queue';

		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

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

			const trackName = await Spotify.getTrack( trackUrlInfo[1] );

			this.queue.push({
				userName: user.displayName,
				trackName: trackName,
				trackUri: trackUri
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
		if ( !this.twitch.stream.isActive ) return;
		const currentTrackUri = await this.getCurrentTrackUri();
		for ( const [_index, track] of this.queue.entries() )
		{
			if ( currentTrackUri !== track.trackUri ) continue;
			this.currentTrack = track;
			this.removeTrackFromQueue( track.trackUri );
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

	public async getCurrentTrack(): Promise<string>
	{
		if ( this.currentTrack )
		{
			return `@${ this.currentTrack.userName }: ${ this.currentTrack.trackName }`;
		}

		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const response = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );

			const result = await response.json() as SpotifyApi.CurrentlyPlayingResponse;
			if ( !result?.item ) return '';

			const track = result.item as SpotifyApi.TrackObjectFull;
			const artist = Spotify.getArtist( track.artists as SpotifyApi.ArtistObjectSimplified[] );

			return `${ Spotify.getTrackName( artist, track.name ) } > ${ Spotify.trackUrl }${ track.id }`;
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	public async getCurrentTrackUri(): Promise<string>
	{
		const headers = await Spotify.getAuthHeaders();
		if ( !headers ) return '';

		try
		{
			const response = await fetch( `${Spotify.apiUrl}/me/player/currently-playing`, { headers: headers } );

			const result = await response.json() as SpotifyApi.CurrentlyPlayingResponse;
			if ( !result?.item?.uri ) return '';

			return result.item.uri;
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

	/**
	 * Get Single track name
	 * @param trackUri
	 * @returns
	 */
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

	/**
	 * Build track name with artist
	 *
	 * @param {string} trackArtist
	 * @param {string} trackName
	 * @returns {string}
	 * @private
	 */
	private static getTrackName( trackArtist: string, trackName: string ): string
	{
		if ( !trackArtist || !trackName ) return '';
		return `${trackArtist} - ${trackName}`;
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

	private removeTrackFromQueue( trackUri: string ): void
	{
		this.queue = this.queue.filter( track => !(track.trackUri === trackUri) );
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
			const currentTrackUri = await this.getCurrentTrackUri();
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
