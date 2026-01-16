import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';
import { TimedMessages } from '@modules/features/TimedMessages.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class Cronjobs
{
	constructor( private twitch: Twitch ) {}

	public run()
	{
		void Deno.cron( 'Bot minutely', '* * * * *', () =>
		{
			TimedMessages.handle( this.twitch );
		} );

		void Deno.cron( 'Bot daily', '0 4 * * *', () =>
		{
			this.twitch.firstChatter.cronjobDaily();
			Database.cronjobDaily();
		} );

		log( 'Cronjobs init ✅' );
	}
}
