/**
 * User Converter functions
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import { HelixUser } from '@twurple/api';
import { ChatUser } from '@twurple/chat';
import { UserData } from '@services/UserData.ts';

import type { SimpleUser } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class UserHelper
{
	public twitchUser: HelixUser | null = null;

	constructor( private twitch: Twitch ) {}

	/** Bot + Broadcaster id and name */
	public static get botId() { return Deno.env.get( 'BOT_ID' ) || '' }
	public static get botName() { return Deno.env.get( 'BOT_NAME' ) || '' }
	public static get broadcasterId() { return Deno.env.get( 'BROADCASTER_ID' ) || '' }
	public static get broadcasterName() { return Deno.env.get( 'BROADCASTER_NAME' ) || '' }

	public async init(): Promise<void>
	{
		await this.setUser();
	}

	/** Get User Data from Twitch
	 *
	 * @param {string|HelixUser} user User name or object
	 */
	public async getUser( user?: string | HelixUser ): Promise<HelixUser | null>
	{
		if ( user instanceof HelixUser )
			return user;

		if ( !user || user?.toLowerCase() === UserHelper.broadcasterName )
			return this.twitchUser;

		try
		{
			// Replace all non alphanumeric chars and underscore
			user = user.replaceAll( /(\W)+/gi, '' ).toLowerCase();
			return await this.twitch.twitchApi.users.getUserByName( user );
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	/** Initially set main user object */
	public async setUser(): Promise<void>
	{
		try
		{
			this.twitchUser = await this.twitch.twitchApi.users.getUserByName( UserHelper.broadcasterName );
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Get simple user data from ChatUser Object */
	public async convertToSimplerUser(
		user: ChatUser | HelixUser | SimpleUser | string | null
	): Promise<SimpleUser | null>
	{
		if ( !user ) return null;
		let color = '';
		let isMod = false;
		let isSub = false;
		let isVip = false;
		let newUser: ChatUser | HelixUser | SimpleUser | string | null = user;

		if ( typeof user === 'string' )
		{
			newUser = await this.getUser( user );
			// No user found? Probably kofi event
			if ( !newUser )
			{
				newUser = {
					name: user,
					displayName: user
				}
			}
		}

		if ( user instanceof ChatUser )
		{
			color = user.color || '';
			isMod = user.isMod;
			isSub = user.isSubscriber;
			isVip = user.isVip;
			newUser = await this.getUser( user.userName );
		}

		if ( newUser instanceof HelixUser )
		{
			return {
				id: newUser.id,
				name: newUser.name,
				displayName: newUser.displayName,
				color: color || await this.getColorForUser( newUser.id ),
				isMod: isMod,
				isSub: isSub,
				isVip: isVip,
				isFollower: UserData.isFollower( newUser.id ),
				profilePictureUrl: newUser.profilePictureUrl
			} as SimpleUser;
		}

		return newUser as SimpleUser;
	}

	/** Get color for user
	 *
	 * @param {string} userId User to get color from
	 */
	private async getColorForUser( userId: string ): Promise<string>
	{
		const defaultColor = '#C7C7F1';
		if ( !userId ) return defaultColor;
		try
		{
			return await this.twitch.twitchApi.chat.getColorForUser( userId ) || defaultColor;
		}
		catch ( error: unknown ) { log( error ) }
		return defaultColor;
	}

	/** Get the right username */
	public getUsernameFromObject( user: HelixUser | ChatUser | SimpleUser | string ): string
	{
		if ( !user ) return '';
		if ( typeof user === 'string' ) return user.toLowerCase();
		if ( user instanceof ChatUser ) return user.userName;
		return user.name;
	}
}
