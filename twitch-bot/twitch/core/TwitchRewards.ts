/**
 * Rewards
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { getRewardSlug, log } from '@shared/helpers.ts';
import { BotData } from '@bot/BotData.ts';

import type { ApiClient } from '@twurple/api';
import type { TwitchReward } from '@shared/types.ts';

import rewards from '@config/twitchRewards.json' with { type: 'json' };

export class TwitchRewards
{
	public rewards: TwitchReward[] = rewards;

	constructor( private twitchApi: ApiClient ) {}

	public get()
	{
		return this.rewards;
	}

	/** Set/Update Channel points rewards */
	public async init(): Promise<void>
	{
		try
		{
			const rewards = this.rewards;
			if ( !rewards ) return;

			const rewardsCurrent = await this.twitchApi.channelPoints.getCustomRewards( BotData.broadcasterId, true );

			// For testing
			// for ( const [ index, reward ] of rewardsCurrent.entries() )
			// {
			// 	log( `${reward.title} > ${reward.id}` );
			// }

			for ( const [ index, reward ] of rewards.entries() )
			{
				if ( reward.id === '' )
				{
					const rewardCreated = await this.twitchApi.channelPoints.createCustomReward( BotData.broadcasterId, reward );
					rewards[index].id = rewardCreated.id;
					log(
						`createCustomReward › ${getRewardSlug( reward.title )} › ${rewardCreated.id}`
					);
					BotData.saveFile( 'twitchRewards', rewards, 'config' );
				}
				else
				{
					const rewardExists = rewardsCurrent.findIndex( ( item ) => item.id === reward.id );
					if ( !rewardExists )
						continue;

					const rewardCurrent = rewardsCurrent[rewardExists];
					// Only update reward if differs from the current reward on twitch
					if (
						reward.title !== rewardCurrent.title ||
						reward.cost !== rewardCurrent.cost ||
						reward.prompt !== rewardCurrent.prompt ||
						reward.globalCooldown !== rewardCurrent.globalCooldown ||
						reward.userInputRequired !== rewardCurrent.userInputRequired ||
						reward.isEnabled !== rewardCurrent.isEnabled ||
						reward.autoFulfill !== rewardCurrent.autoFulfill
					)
					{
						this.twitchApi.channelPoints.updateCustomReward(
							BotData.broadcasterId,
							reward.id.toString(),
							reward
						);
					}
				}
			}

			log( 'Rewards (re)loaded ✅' );

			this.rewards = rewards;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Reload all JSON data files and update class properties */
	public reload(): void
	{
		try
		{
			this.rewards = JSON.parse(
				Deno.readTextFileSync( './twitch-bot/config/twitchRewards.json' )
			);
			void this.init();
		}
		catch ( error ) { log( error ) }
	}
}
