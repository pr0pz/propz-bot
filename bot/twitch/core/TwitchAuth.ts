/**
 * Twitch Auth Provider Controller
 *
 * https://twurple.js.org/docs/auth/providers/refreshing.html
 *
 * @author Wellington Estevo
 * @version 2.4.0
 */

import { log } from '@shared/helpers.ts';
import { exchangeCode, RefreshingAuthProvider } from '@twurple/auth';
import { Database } from '@services/Database.ts';

import type { AccessToken } from '@twurple/auth';
import type { TwitchAuthData } from '@shared/types.ts';

export class TwitchAuth
{
	private authData = new Map<string, TwitchAuthData>( [
		[ 'bot', {
			authProvider: null,
			initialOauthCode: Deno.env.get( 'BOT_INITIAL_OAUTH_CODE' ) || '',
			userId: Deno.env.get( 'BOT_ID' ) || '',
			scopes: [ 'chat:read', 'chat:edit' ]
		} ],
		[ 'broadcaster', {
			authProvider: null,
			initialOauthCode: Deno.env.get( 'BROADCASTER_INITIAL_OAUTH_CODE' ) || '',
			userId: Deno.env.get( 'BROADCASTER_ID' ) || '',
			scopes: [
				'bits:read',
				'channel:edit:commercial',
				'channel:moderate',
				'channel:read:ads',
				'channel:read:charity',
				'channel:read:editors',
				'channel:read:goals',
				'channel:read:guest_star',
				'channel:read:hype_train',
				'channel:read:polls',
				'channel:read:predictions',
				'channel:read:subscriptions',
				'channel:read:vips',
				'channel:manage:ads',
				'channel:manage:broadcast',
				'channel:manage:raids',
				'channel:manage:redemptions',
				'chat:edit',
				'chat:read',
				'clips:edit',
				'moderation:read',
				'moderator:manage:announcements',
				'moderator:manage:shield_mode',
				'moderator:manage:shoutouts',
				'moderator:read:automod_settings',
				'moderator:read:chatters',
				'moderator:read:followers',
				'moderator:read:guest_star',
				'moderator:read:moderators',
				'moderator:read:vips',
				'user:bot',
				'user:manage:whispers',
				'user:read:chat',
				'user:read:emotes',
				'user:read:follows',
				'user:read:subscriptions'
			]
		} ]
	] );

	private clientId = Deno.env.get( 'TWITCH_CLIENT_ID' ) || '';
	private clientSecret = Deno.env.get( 'TWITCH_CLIENT_SECRET' ) || '';
	private redirectUri = `http://localhost:${ Deno.env.get( 'BOT_PORT' ) || '3000' }`;

	constructor()
	{
		const db = Database.getInstance();

		for ( const [ key, value ] of this.authData.entries() )
		{
			db.query( `INSERT OR IGNORE INTO auth (name, data) VALUES ('twitch-${ key }', '')` );

			value.authProvider = new RefreshingAuthProvider( {
				clientId: this.clientId,
				clientSecret: this.clientSecret,
				redirectUri: this.redirectUri,
				appImpliedScopes: value.scopes
			} );

			value.authProvider.onRefresh( ( _userId: string, newTokenData: AccessToken ) =>
			{
				try
				{
					db.query(
						`UPDATE auth SET data = ? WHERE name = 'twitch-${ key }'`,
						[ JSON.stringify( newTokenData, null, '\t' ) ]
					);
					log( `Refreshed ${ key } Twitch Token` );
				}
				catch ( error: unknown ){ log( error ) }
			} );

			this.authData.set( key, value );
		}
	}

	/** Returns authprovider */
	public async getAuthProvider( type: 'broadcaster' | 'bot' ): Promise<RefreshingAuthProvider | null>
	{
		const authData = this.authData.get( type )!;
		if ( !authData.authProvider )
		{
			log( new Error( `No authProvider. WTF?` ) );
			return null;
		}

		const tokenData = await this.getTokenData( type );
		if ( !tokenData )
		{
			log( new Error( `No tokendata. WTF?` ) );
			return null;
		}

		try
		{
			authData.authProvider.addUser( authData.userId, tokenData, [ 'chat' ] );
			this.authData.set( type, authData );
		}
		catch ( error: unknown ){ log( error ) }

		return authData.authProvider;
	}

	/**
	 * Get tokenData for further auth process
	 *
	 * @param {'broadcaster'|'bot'} type Type of token data to get
	 */
	private async getTokenData( type: 'broadcaster' | 'bot' ): Promise<AccessToken | undefined>
	{
		const db = Database.getInstance();
		try
		{
			const results = db.queryEntries(
				`SELECT data FROM auth WHERE name = 'twitch-${ type }'`
			);
			const newTokenData = results?.[ 0 ]?.[ 'data' ] as string || '';

			if ( newTokenData )
			{
				log( `Tokendata for ${ type } ready (from DB)` );
				return JSON.parse( newTokenData ) as AccessToken;
			}
		}
		catch ( _error: unknown )
		{
			log( `No tokendata found. Getting new from Twitch.` );
		}

		// DB data exist, so:
		// Get the initial tokenData using the initial OAuth code
		try
		{
			const newTokenData = await exchangeCode(
				this.clientId,
				this.clientSecret,
				this.authData.get( type )!.initialOauthCode,
				this.redirectUri
			);

			db.query(
				`UPDATE auth SET data = ? WHERE name = 'twitch-${ type }'`,
				[ JSON.stringify( newTokenData, null, '\t' ) ]
			);

			log( `Tokendata for ${ type } ready (from Twitch)` );
			return newTokenData;
		}
		catch ( error: unknown ){ log( error ) }
	}
}
