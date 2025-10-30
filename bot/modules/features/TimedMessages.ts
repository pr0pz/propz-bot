/**
 * Timed Messages
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { getMessage, objectToMap } from '@shared/helpers.ts';

import type { Twitch } from '@twitch/core/Twitch.ts';
import type { TwitchTimers } from '@shared/types.ts';

export class TimedMessages
{
	public static handle( twitch: Twitch ): void
	{
		const timers: Map<string, TwitchTimers> = objectToMap( JSON.parse(
			Deno.readTextFileSync( './bot/config/twitchTimers.json' )
		) );

		const minutesPassed = Math.floor(
			(Date.now() - twitch.stream.startTime) / 1000 / 60
		).toString();
		const timer = timers.get( minutesPassed );
		if ( !timer ) return;

		const message = getMessage( timer.message, twitch.stream.language );
		if ( !message ) return;

		if ( timer.isAnnouncement )
		{
			void twitch.chat.sendAnnouncement( message );
			return;
		}
		void twitch.chat.sendAction( message );
	}
}
