/**
 * Event Data
 *
 * @author Wellington Estevo
 * @version 2.3.1
 */

import { Database } from '@services/Database.ts';
import { log, objectToMap } from '@shared/helpers.ts';
import { UserData } from '@services/UserData.ts';

import events from '@config/twitchEvents.json' with { type: 'json' };

import type { TwitchEvent, TwitchEventData, TwitchEventDataLast } from '@shared/types.ts';

export class StreamEvents
{
	private events: Map<string, TwitchEvent>;

	constructor()
	{
		this.events = objectToMap( events );
	}

	/** Add new event */
	public static add( event: TwitchEventData ): void
	{
		if (
			// No id? Probably kofi event
			!event?.user?.id ||
			event.type?.startsWith( 'reward' ) ||
			StreamEvents.exists( event )
		) return;

		// First try to add user to DB to prevent key constraint errors
		void UserData.addUser( event.user.id, event.user.name );

		// Add to event table
		try
		{
			const db = Database.getInstance();
			db.query(
				'INSERT INTO twitch_events (type, user_id, timestamp, count) VALUES (?, ?, ?, ?)',
				[ event.type, event.user.id, event.timestamp, event.count ?? 0 ]
			);
		}
		catch ( error: unknown ) { log( error ) }

		// Update user count data based on event
		UserData.updateCount( event );
	}

	/** Get config for single twitch event */
	public get( eventType: string ): TwitchEvent
	{
		if ( !eventType ) return {};
		return this.events.get( eventType ) || {};
	}

	/** Return all Event data */
	public getAll():  Map<string, TwitchEvent>
	{
		return this.events;
	}

	/** Check if an event already exists */
	public static exists( eventToCheck: TwitchEventData ): boolean
	{
		if ( !eventToCheck ) return false;
		try
		{
			const db = Database.getInstance();
			const events = db.queryEntries( `
				SELECT
					e.type,
					e.user_id,
					e.timestamp,
					e.count,
					u.name
				FROM twitch_events e
				LEFT JOIN twitch_users u ON e.user_id = u.id
				ORDER BY e.id DESC
			` );

			return events.some(
				( event ) =>
				{
					if ( event.type === 'follow' )
					{
						return (
							event.type === eventToCheck.type &&
							event.user_id === eventToCheck.user.id
						);
					}
					else
					{
						return (
							event.type === eventToCheck.type &&
							event.user_id === eventToCheck.user.id &&
							event.count === eventToCheck.count &&
							(
								event.timestamp === eventToCheck.timestamp ||
								event.timestamp === eventToCheck.timestamp + 1 ||
								event.timestamp === eventToCheck.timestamp - 1
							)
						);
					}
				}
			);
		}
		catch ( error: unknown ) { log( error ) }
		return false;
	}

	/** Get last 10 saved events */
	public getLast( streamLanguage: string = 'de' ): TwitchEventDataLast[]
	{
		try
		{
			streamLanguage = streamLanguage || 'de';
			const db = Database.getInstance();
			const events = db.queryEntries( `
				SELECT 
					e.type,
					e.user_id,
					e.timestamp,
					e.count,
					u.name  -- Include the name from users table
				FROM twitch_events e
				LEFT JOIN twitch_users u ON e.user_id = u.id
				ORDER BY e.id DESC
				LIMIT 10;
			` ) as unknown as TwitchEventDataLast[];

			for ( const [ index, event ] of events.entries() )
			{
				const eventConfig = this.get( event.type as string );
				if ( eventConfig?.extra?.[streamLanguage] )
					events[index].extra = eventConfig.extra[streamLanguage];
			}
			return events;
		}
		catch ( error: unknown ) { log( error ) }
		return [];
	}

	/** Reload all JSON data files and update class properties */
	public reload(): void
	{
		try
		{
			this.events = objectToMap( JSON.parse(
				Deno.readTextFileSync( './bot/config/twitchEvents.json' )
			) );
			log( 'Events reloaded ♻️' );
		}
		catch ( error ) { log( error ) }
	}
}
