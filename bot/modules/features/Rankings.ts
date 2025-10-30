/**
 * Rankings
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { BotData } from '@services/BotData.ts';
import { StreamElements } from '@integrations/StreamElements.ts';
import { getTimePassed } from '@shared/helpers.ts';
import { UserData } from '@features/UserData.ts';

import type { StreamElementsViewerStats, TwitchUserData } from '@shared/types.ts';

export class Rankings
{
	/** Get watchtime command text
	 *
	 * @param {string} userName
	 * @param {string} message
	 * @param {string} broadcasterName Broadcaster display name
	 */
	public static async getUserWatchtimeText( userName: string, message: string, broadcasterName: string ): Promise<string>
	{
		if ( !userName || !message )
			return '';

		const viewerStats: StreamElementsViewerStats | undefined = await StreamElements.getViewerStats( userName );

		if ( !viewerStats || !('watchtime' in viewerStats) )
			return '';

		const watchtime = viewerStats.watchtime * 60 * 1000;

		message = message.replace( '[user]', userName );
		message = message.replace( '[broadcaster]', broadcasterName );
		message = message.replace( '[count]', getTimePassed( watchtime ) );
		message = message.replace( '[rank]', viewerStats.rank.toString() );

		return message;
	}

	/** Get user score: messages, firsts, follow
	 *
	 * @param {string} userName User to get score
	 * @param {string} message Message to search replace values
	 * @param {keyof TwitchUserData} type Type of score to get
	 * @param {BotData} data Bot Data controller
	 */
	public static async getUserScoreText(
		userName: string,
		message: string,
		type: keyof TwitchUserData = 'message_count',
		data: BotData
	): Promise<string>
	{
		if (
			!userName || !message || !type ||
			userName.toLowerCase() === BotData.broadcasterName
		) return '';

		const user = await data.getUser( userName );
		if ( !user ) return '';

		const usersData = UserData.getAll();
		if ( !usersData ) return '';

		let count: string | number = Number( usersData.get( user.id )?.[ type ] ) ?? 0;
		if ( !count ) return '';

		// Sort users by type
		const sortedUsers = usersData
			.entries()
			.filter( ( [ _user_id, user ] ) => user[ type ] as number > 0 )
			.map( ( [ user_id, user ] ) => [ user_id, user[ type ] as number, user.name ] )
			.toArray()
			.sort( ( a, b ) =>
			{
				// Aufsteigende Sortierung für 'follow'
				if ( type === 'follow_date' )
				{
					return (a[ 1 ] as number) - (b[ 1 ] as number);
				}
				// Absteigende Sortierung für andere Typen
				else
				{
					return (b[ 1 ] as number) - (a[ 1 ] as number);
				}
			} );

		const rank = sortedUsers.findIndex( ( [ id, _data, _userName ] ) => id === user.id ) + 1;

		if ( type === 'follow_date' )
			count = getTimePassed( Date.now() - count * 1000 );

		message = message.replace( '[user]', user.displayName );
		message = message.replace( '[count]', count.toString() );
		message = message.replace( '[rank]', rank.toString() );
		message = message.replace( '[broadcaster]', BotData.broadcasterName );

		return message;
	}

	/**
	 * Get ranking text for chat message
	 *
	 * @param {keyof } type
	 * @param {Map<number,TwitchUserData>} usersData
	 * @returns {string}
	 */
	public static getRankingText(
		type: keyof TwitchUserData = 'message_count',
		usersData: Map<string,TwitchUserData>
	): string
	{
		if ( !type || !usersData ) return '';

		// Sort users by type
		const sortedUsers = usersData
			.entries()
			.filter( ( [ _user_id, user ] ) => user[ type ] as number > 0 )
			.map( ( [ _user_id, user ] ) => [ user.name, user[ type ] as number, user.gift_count, user.raid_viewers ] )
			.toArray()
			.sort( ( a, b ) => (b[ 1 ] as number) - (a[ 1 ] as number) )
			.slice( 0, 10 );

		let message = '';
		for ( let i = 0; i < sortedUsers.length; i++ )
		{
			// ×
			if ( message ) message += ' ||| ';
			message += `${ i + 1 }. @${ sortedUsers[ i ][ 0 ] }: ${ sortedUsers[ i ][ 1 ] }`

			if ( type === 'gift_subs' )
				message += ` subs (${ sortedUsers[ i ][ 2 ] }x gifted)`;
			else if ( type === 'raid_count' )
				message += ` raids (${ sortedUsers[ i ][ 3 ] } viewers)`;
			else if ( type === 'sub_count' )
				message += ` months`;
		}

		return message;
	}
}
