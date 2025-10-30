/**
 * Focus
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { clearTimer, getRewardSlug, log } from '@shared/helpers.ts';

import type { Twitch } from '@twitch/core/Twitch.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

export class Focus
{
	constructor( private twitch: Twitch, public timer: number = 0 ) {}

	/**
	 * Handle Focus Command
	 *
	 * @param {string|number} focusStatusOrTime Focus status or focus time
	 */
	public handle( focusStatusOrTime: string | number = 10 ): number
	{
		if ( !focusStatusOrTime || !focusStatusOrTime.isNumeric() ) return 0;

		this.timer = clearTimer( this.timer );
		focusStatusOrTime = parseInt( focusStatusOrTime.toString() );

		this.timer = setTimeout( () => this.set( false ), focusStatusOrTime * 60 * 1000 );
		void this.set( true, focusStatusOrTime );

		return focusStatusOrTime;
	}

	/** Toggle Focus status */
	public async set( focusStatus: boolean = false, focusTimer: number = 10 ): Promise<void>
	{
		if (
			typeof focusStatus !== 'boolean' ||
			typeof focusTimer !== 'number'
		) return;

		this.setRewardPause( focusStatus );
		const eventType = focusStatus ? 'focusstart' : 'focusstop';

		void this.twitch.events.eventProcessor.process( {
			eventType: eventType,
			user: await this.twitch.userHelper.getUser() ||  UserHelper.broadcasterName,
			eventCount: focusTimer
		} );

		// Clear timeout
		if ( !focusStatus && this.timer )
			this.timer = clearTimer( this.timer );
	}

	/**
	 * Toggle Reward Status for focus blacklist rewards
	 *
	 * @param {boolean} focusStatus
	 */
	private setRewardPause( focusStatus: boolean = false ): void
	{
		if ( typeof focusStatus !== 'boolean' ) return;

		try
		{
			for ( const [ _index, reward ] of this.twitch.rewards.get().entries() )
			{
				const rewardSlug = getRewardSlug( reward.title );
				if ( !this.twitch.streamEvents.get( rewardSlug ).disableOnFocus ) continue;

				const rewardUpdateData = {
					title: reward.title,
					cost: reward.cost,
					isPaused: focusStatus
				};

				this.twitch.twitchApi.channelPoints.updateCustomReward(
					UserHelper.broadcasterId,
					reward.id.toString(),
					rewardUpdateData
				);
			}
		}
		catch ( error: unknown ) { log( error ) }
	}
}
