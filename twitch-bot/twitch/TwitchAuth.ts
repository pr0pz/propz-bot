/**
 * Twitch Auth Provider Controller
 *
 * https://twurple.js.org/docs/auth/providers/refreshing.html
 *
 * @author Wellington Estevo
 * @version 1.6.4
 */

import { log } from '@propz/helpers.ts';
import { exchangeCode, RefreshingAuthProvider } from '@twurple/auth';

import type { AccessToken } from '@twurple/auth';
import type { Database } from '../bot/Database.ts';

export class TwitchAuth
{
	private authProvider: RefreshingAuthProvider | null = null;
	private scopes = [
		'bits:read',
		'channel:bot',
		'channel:edit:commercial',
		'channel:manage:ads',
		'channel:manage:broadcast',
		'channel:manage:guest_star',
		'channel:manage:moderators',
		'channel:manage:polls',
		'channel:manage:predictions',
		'channel:manage:raids',
		'channel:manage:redemptions',
		'channel:manage:schedule',
		'channel:manage:videos',
		'channel:manage:vips',
		'channel:moderate',
		'channel:read:ads',
		'channel:read:charity',
		'channel:read:editors',
		'channel:read:goals',
		'channel:read:guest_star',
		'channel:read:hype_train',
		'channel:read:polls',
		'channel:read:predictions',
		'channel:read:redemptions',
		'channel:read:subscriptions',
		'channel:read:vips',
		'chat:edit',
		'chat:read',
		'clips:edit',
		'moderation:read',
		'moderator:manage:announcements',
		'moderator:manage:automod',
		'moderator:manage:automod_settings',
		'moderator:manage:banned_users',
		'moderator:manage:blocked_terms',
		'moderator:manage:chat_messages',
		'moderator:manage:chat_settings',
		'moderator:manage:guest_star',
		'moderator:manage:shield_mode',
		'moderator:manage:shoutouts',
		'moderator:read:automod_settings',
		'moderator:read:blocked_terms',
		'moderator:read:chatters',
		'moderator:read:chat_settings',
		'moderator:read:followers',
		'moderator:read:guest_star',
		'moderator:read:shield_mode',
		'moderator:read:shoutouts',
		'user:bot',
		'user:manage:chat_color',
		'user:manage:blocked_users',
		'user:manage:whispers',
		'user:read:blocked_users',
		'user:read:broadcast',
		'user:read:chat',
		'user:read:email',
		'user:read:follows',
		'user:read:moderated_channels',
		'user:read:subscriptions'
	];

	private userId = Deno.env.get( 'TWITCH_USER_ID' ) || '';
	private clientId = Deno.env.get( 'TWITCH_CLIENT_ID' ) || '';
	private clientSecret = Deno.env.get( 'TWITCH_CLIENT_SECRET' ) || '';
	private redirectUri = Deno.env.get( 'TWITCH_REDIRECT_URI' ) || '';
	private initialOauthCode = Deno.env.get( 'TWITCH_INITIAL_OAUTH_CODE' ) || '';

	constructor( private db: Database )
	{
		this.authProvider = new RefreshingAuthProvider( {
			clientId: this.clientId,
			clientSecret: this.clientSecret,
			redirectUri: this.redirectUri,
			appImpliedScopes: this.scopes
		} );

		// Rewrite token data on token refresh
		this.authProvider.onRefresh( ( _userId: string, newTokenData: AccessToken ) =>
		{
			try
			{
				this.db.query( `UPDATE auth SET data = ? WHERE name = 'twitch'`, [
					JSON.stringify( newTokenData, null, '\t' )
				] );
			}
			catch ( error: unknown )
			{
				log( error );
			}
		} );
	}

	/** Get tokenData for further auth process */
	private async getTokenData(): Promise<AccessToken | undefined>
	{
		try
		{
			const results = this.db.queryEntries( `SELECT data FROM auth WHERE name = 'twitch'` );
			const newTokenData = results?.[0]?.['data'] as string || '';

			if ( newTokenData )
			{
				log( `Tokendata ready (from DB)` );
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
				this.initialOauthCode,
				this.redirectUri
			);

			this.db.query( `UPDATE auth SET data = ? WHERE name = 'twitch'`, [
				JSON.stringify( newTokenData, null, '\t' )
			] );

			log( `Tokendata ready (from Twitch)` );
			return newTokenData;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Returns authprovider */
	async getAuthProvider(): Promise<RefreshingAuthProvider | undefined>
	{
		if ( !this.authProvider )
		{
			log( new Error( `No authProvider. WTF?` ) );
			return;
		}

		const tokenData = await this.getTokenData();
		if ( !tokenData )
		{
			log( new Error( `No tokendata. WTF?` ) );
			return;
		}

		try
		{
			this.authProvider.addUser( this.userId, tokenData, [ 'chat' ] );
		}
		catch ( error: unknown )
		{
			log( error );
		}

		return this.authProvider;
	}
}
