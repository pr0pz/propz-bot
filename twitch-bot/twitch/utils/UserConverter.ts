/**
 * User Converter functions
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { HelixUser } from '@twurple/api';
import { ChatUser } from '@twurple/chat';

import type { SimpleUser } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class UserConverter
{
	constructor( private twitch: Twitch ) {}

	/** Get simple user data from ChatUser Object */
	async convertToSimplerUser(
		user: ChatUser | HelixUser | SimpleUser | string | null
	): Promise<SimpleUser | null>
	{
		if ( !user ) return null;
		let color = '';
		let isSub = false;
		let isVip = false;
		let newUser: ChatUser | HelixUser | SimpleUser | string | null = user;

		if ( typeof user === 'string' )
		{
			newUser = await this.twitch.data.getUser( user );
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
			isSub = user.isSubscriber ?? false;
			isVip = user.isVip ?? false;
			newUser = await this.twitch.data.getUser( user.userName );
		}

		if ( newUser instanceof HelixUser )
		{
			return {
				id: newUser.id,
				name: newUser.name,
				displayName: newUser.displayName,
				color: color || await this.twitch.data.getColorForUser( newUser.id ),
				isMod: this.twitch.data.mods.includes( newUser.name ),
				isSub: isSub ?? false,
				isVip: isVip ?? false,
				isFollower: this.twitch.data.isFollower( newUser.id ),
				profilePictureUrl: newUser.profilePictureUrl
			} as SimpleUser;
		}

		return newUser as SimpleUser;
	}

	/** Get the right username */
	getUsernameFromObject( user: HelixUser | ChatUser | SimpleUser | string )
	{
		if ( !user ) return '';
		if ( typeof user === 'string' ) return user.toLowerCase();
		if ( user instanceof ChatUser ) return user.userName;
		return user.name;
	}
}
