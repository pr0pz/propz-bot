/**
 * First Chatter
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';

import type { SimpleUser } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class FirstChatter
{
	public firstChatter = '';

	constructor( private twitch: Twitch ) {}

	get() { return this.firstChatter; }

	/** Check and set firstchatter of each stream
	 *
	 * @param {SimpleUser} user user data
	 */
	set( user: SimpleUser )
	{
		if (
			this.firstChatter ||
			user?.name === this.twitch.data.broadcasterName ||
			user.name === this.twitch.data.botName
		) return;

		this.firstChatter = user.displayName;
		this.twitch.data.updateUserData( user, 'first_count' );
		this.twitch.data.updateStreamStats( user, 'first_chatter' );

		log( `First chatter goes to: ${ this.firstChatter }` );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'firstchatter',
			user: user.displayName
		} );
	}

	/**
	 * Daily Cronjob Tasks
	 */
	cronjobDaily(): void
	{
		this.firstChatter = '';
	}
}
