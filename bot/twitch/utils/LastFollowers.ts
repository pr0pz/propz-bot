import { StreamEvents } from '@services/StreamEvents.ts';
import { UserData} from '@services/UserData.ts';

import type { Twitch } from '@twitch/core/Twitch.ts';
import type { SimpleUser, TwitchEventData } from '@shared/types.ts';

export class LastFollowers
{
	/** Set last 20 followers */
	public static async get( twitch: Twitch ): Promise<void>
	{
		const user = await twitch.userHelper.getUser();
		if ( !user ) return;

		const followers = await user.getChannelFollowers();
		if ( !followers.data ) return;

		for ( const follower of followers.data )
		{
			const followTimestamp = follower.followDate.getTime() / 1000;
			const followerData: SimpleUser = {
				id: follower.userId,
				name: follower.userName,
				displayName: follower.userDisplayName
			};
			const follow: TwitchEventData = {
				type: 'follow',
				user: followerData,
				timestamp: followTimestamp
			};

			// Follower already exists
			if ( UserData.get( follower.userId )?.follow_date )
				continue;

			StreamEvents.add( follow );
		}
	}
}
