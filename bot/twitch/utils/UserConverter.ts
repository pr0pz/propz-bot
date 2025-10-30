/**
 * User Converter functions
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { HelixUser } from '@twurple/api';
import { ChatUser } from '@twurple/chat';
import { UserData } from '@modules/features/UserData.ts';

import type { SimpleUser } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class UserConverter
{
	constructor( private twitch: Twitch ) {}

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
			isMod = user.isMod;
			isSub = user.isSubscriber;
			isVip = user.isVip;
			newUser = await this.twitch.data.getUser( user.userName );
		}

		if ( newUser instanceof HelixUser )
		{
			return {
				id: newUser.id,
				name: newUser.name,
				displayName: newUser.displayName,
				color: color || await this.twitch.data.getColorForUser( newUser.id ),
				isMod: isMod,
				isSub: isSub,
				isVip: isVip,
				isFollower: UserData.isFollower( newUser.id ),
				profilePictureUrl: newUser.profilePictureUrl
			} as SimpleUser;
		}

		return newUser as SimpleUser;
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
