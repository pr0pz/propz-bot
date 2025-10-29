/**
 * User Data Controller
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import { Database } from '@bot/Database.ts';

import type { SimpleUser, TwitchEventData, TwitchUserData } from '@shared/types.ts';

export class UserData
{
	/**
	 * Add user to DB
	 *
	 * @param {number} userId
	 * @param {string} userName
	 */
	public static addUser( userId: number|string, userName: string ): TwitchUserData|undefined
	{
		try
		{
			const db = Database.getInstance();
			db.query( 'INSERT OR IGNORE INTO twitch_users (id, name) VALUES (?, ?)', [ userId, userName ] );
			return {
				id: userId.toString(),
				name: userName,
				profile_picture: '',
				color: '#C7C7F1',
				follow_date: 0,
				message_count: 0,
				first_count: 0,
				sub_count: 0,
				gift_count: 0,
				gift_subs: 0,
				raid_count: 0,
				raid_viewers: 0
			}
		}
		catch ( error: unknown ) { log( error ) }
		return;
	}

	/** Get data for twitch user/s
	 *
	 * @param {string} userId User ID
	 * @returns {TwitchUserData|undefined}
	 */
	public static get( userId: string ): TwitchUserData | undefined
	{
		try
		{
			const db = Database.getInstance();
			const result = db.preparedStatements.get( 'getUserData' )?.first( [ userId ] ) || [];
			if ( !result || result.length === 0 ) return;

			return {
				id: result[0],
				name: result[1],
				color: result[3],
				profile_picture: result[2],
				follow_date: result[4],
				message_count: result[5],
				first_count: result[6],
				sub_count: result[7],
				gift_count: result[8],
				gift_subs: result[9],
				raid_count: result[10],
				raid_viewers: result[11],
			} as TwitchUserData;
		}
		catch ( error: unknown ) { log( error ) }
		return;
	}

	/** Get data for twitch user/s
	 *
	 * @returns {Map<number,TwitchUserData>}
	 */
	public static getAll(): Map<string, TwitchUserData>
	{
		const users = new Map<string, TwitchUserData>();
		try
		{
			const db = Database.getInstance();
			const results = db.queryEntries<TwitchUserData>( 'SELECT * FROM twitch_users' );

			if ( !results || results.length === 0 )
				return users;

			for ( const user of results )
			{
				users.set( user.id, {
					id: user.id,
					name: user.name,
					profile_picture: user.profile_picture ?? '',
					color: user.color ?? '',
					follow_date: user.follow_date,
					message_count: user.message_count,
					first_count: user.first_count,
					sub_count: user.sub_count,
					gift_count: user.gift_count,
					gift_subs: user.gift_subs,
					raid_count: user.raid_count,
					raid_viewers: user.raid_viewers,
				} );
			}

			return users;
		}
		catch ( error: unknown ) { log( error ) }
		return users;
	}

	/**
	 * Check if user is a follower
	 *
	 * @param {string} userId
	 * @returns {boolean}
	 */
	public static isFollower( userId: string ): boolean
	{
		const userData = UserData.get( userId );
		return !!userData?.follow_date;
	}

	/** Update specific saved data from given user.
	 *
	 * @param {Object} user User object
	 * @param {string} dataName Name of data to update
	 * @param {string|int|boolean} dataValue New data value
	 */
	public static update(
		user: SimpleUser,
		dataName: string,
		dataValue: number = 1
	): void
	{
		if ( !user?.id || !dataName ) return;

		try
		{
			let userData = UserData.get( user.id );
			// Add user if not in DB
			if ( !userData )
			{
				userData = UserData.addUser( user.id, user.name );
				if ( !userData ) return;
			}

			const newUserData = [
				user.displayName,
				user.color || '#C7C7F1',
				user.profilePictureUrl || '',
				dataName === 'follow_date' && !userData.follow_date ? dataValue : userData.follow_date,
				dataName === 'message_count' ? userData.message_count + 1 : userData.message_count,
				dataName === 'first_count' ? userData.first_count + 1 : userData.first_count,
				dataName === 'sub_count' ? userData.sub_count + 1 : userData.sub_count,
				dataName === 'gift_count' ? userData.gift_count + 1 : userData.gift_count,
				dataName === 'gift_subs' ? userData.gift_subs + dataValue : userData.gift_subs,
				dataName === 'raid_count' ? userData.raid_count + 1 : userData.raid_count,
				dataName === 'raid_viewers' ? userData.raid_viewers + dataValue : userData.raid_viewers,
				user.id
			];

			const db = Database.getInstance();
			db.preparedStatements.get( 'updateUserData' )?.execute( newUserData );

		}
		catch ( error: unknown ) { log( error ) }
	}

	/**
	 * Update User count data based on event
	 *
	 * @param {} event
	 */
	public static updateCount( event: TwitchEventData ): void
	{
		let type = '';
		let value = event.count ?? 1;

		if ( event.type === 'sub' || event.type.startsWith('resub') )
		{
			type = 'sub_count';
			value = 1;
		}
		else if ( event.type === 'subgift' || event.type.startsWith('communitysub') )
		{
			type = 'gift_count';
		}
		else if ( event.type === 'raid' )
		{
			type = 'raid_count';
		}
		else if ( event.type === 'follow')
		{
			type = 'follow_date';
			value = event.timestamp;
		}
		else {
			return;
		}

		try
		{
			UserData.update( event.user, type, value );
			if ( type === 'gift_count' )
				UserData.update( event.user, 'gift_subs', value );
			else if ( type === 'raid_count' )
				UserData.update( event.user, 'raid_viewers', value );
		}
		catch ( error: unknown ) { log( error ) }
	}
}
