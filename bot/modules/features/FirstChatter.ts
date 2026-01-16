import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';
import { StreamStats } from '@services/StreamStats.ts';
import { UserData } from '@services/UserData.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { SimpleUser, TwitchFirstChatter } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class FirstChatter
{
	private firstChatter: TwitchFirstChatter | null = null;
	private secondChatter: TwitchFirstChatter | null = null;

	constructor( private twitch: Twitch )
	{
		const firstChatter = this.get();
		if ( firstChatter )
		{
			this.firstChatter = {
				name: firstChatter,
				timestamp: new Date().getTime()
			}
		}
	}

	public get(): string
	{
		if ( this.firstChatter )
			return this.firstChatter.name;

		try
		{
			const db = Database.getInstance();
			const result = db.query( `
				SELECT u.name
				FROM stream_stats s
				LEFT JOIN twitch_users u ON s.user_id = u.id
				WHERE first_chatter = 1
				LIMIT 1;` );
			return result?.[0]?.[0]?.toString() || '';
		}
		catch ( error: unknown ) { log( error ) }
		return '';
	}

	public set( user: SimpleUser ): void
	{
		if (
			user?.name ===  UserHelper.broadcasterName ||
			user.name ===  UserHelper.botName
		) return;

		if ( !this.firstChatter )
		{
			UserData.update( user, 'first_count' );
			StreamStats.update( user, 'first_chatter' )

			this.firstChatter = {
				name: user.displayName,
				timestamp: new Date().getTime()
			};

			log( `First chatter goes to: ${ user.displayName }` );

			setTimeout( () => this.triggerEvent( user ), 1000 );

			return;
		}

		if ( !this.secondChatter )
		{
			this.secondChatter = {
				name: user.displayName,
				timestamp: new Date().getTime()
			};

			log( `Second chatter goes to: ${ user.displayName }` );
		}
	}

	public triggerEvent( user: SimpleUser | string ): void
	{
		const count = this.secondChatter ?
			this.secondChatter!.timestamp - this.firstChatter!.timestamp:
			1000;

		void this.twitch.events.eventProcessor.process( {
			eventType: 'firstchatter',
			user: user,
			eventCount: count
		} );
	}

	public cronjobDaily()
	{
		this.firstChatter = null;
		this.secondChatter = null;
	}
}
