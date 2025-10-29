/**
 * Static data
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { getRewardSlug, log, objectToMap } from '@shared/helpers.ts';
import { Database } from '@bot/Database.ts';
import { HelixUser } from '@twurple/api';

import type { SimpleUser, TwitchEmote, TwitchEvent, TwitchEventData, TwitchReward, TwitchStreamDate, TwitchTimers, TwitchUserData } from '@shared/types.ts';
import type { ApiClient } from '@twurple/api';

// Config
import events from '@config/twitchEvents.json' with { type: 'json' };
import rewards from '@config/twitchRewards.json' with { type: 'json' };
import timers from '@config/twitchTimers.json' with { type: 'json' };

import { BetterTTV } from '@modules/integrations/BetterTTV.ts';
import { FrankerFaceZ } from '@modules/integrations/FrankerFaceZ.ts';
import { SevenTV } from '@modules/integrations/SevenTV.ts';
import { TwitchInsights } from '@modules/integrations/TwitchInsights.ts';

export class BotData
{
	public twitchApi: ApiClient;
	public db: Database;

	// Config
	public events: Map<string, TwitchEvent>;
	public rewards: TwitchReward[] = rewards;
	public timers: Map<string, TwitchTimers>;

	// Dynamic
	public twitchUser: HelixUser | null = null;
	public mods: string[] = [];
	public emotes: Map<string, string> = new Map();
	public bots: string[] = [];

	constructor( twitchApi: ApiClient )
	{
		this.twitchApi = twitchApi;
		this.db = Database.getInstance();
		this.timers = objectToMap( timers );
		this.events = objectToMap( events );
	}

	async init()
	{
		await this.setUser();
		void this.setEmotes();
		void this.setFollowers();
		void this.setMods();
		void this.setRewards();
		void this.setBots();
	}

	/** Get own twitch user id */
	get botId()
	{
		return Deno.env.get( 'BOT_ID' ) || '';
	}

	/** Get own twitch user name */
	get botName()
	{
		return Deno.env.get( 'BOT_NAME' ) || '';
	}

	/** Get own twitch user id */
	get broadcasterId()
	{
		return Deno.env.get( 'BROADCASTER_ID' ) || '';
	}

	/** Get own twitch user id */
	get broadcasterName()
	{
		return Deno.env.get( 'BROADCASTER_NAME' ) || '';
	}

	/** Get Stream first chatter */
	get firstChatter()
	{
		try
		{
			const result = this.db.query( `
				SELECT u.name
				FROM stream_stats s
				LEFT JOIN twitch_users u ON s.user_id = u.id
				WHERE first_chatter = 1
				LIMIT 1;` );
			return result?.[0]?.[0]?.toString() || '';
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
	}

	/** Get all Stream Stats */
	get streamStats()
	{
		try
		{
			return this.db.queryEntries( `
				SELECT
					s.user_id,
					u.name,
					u.profile_picture,
					u.color,
					s.message,
					s.cheer,
					s.follow,
					s.raid,
					s.first_chatter,
					s.sub,
					s.subgift
				FROM stream_stats s
				LEFT JOIN twitch_users u ON s.user_id = u.id
			` );
		}
		catch ( error: unknown ) { log( error ) }
		return [];
	}

	/** Get color for user
	 *
	 * @param {string} userId User to get color from
	 */
	async getColorForUser( userId: string )
	{
		const defaultColor = '#C7C7F1';
		if ( !userId ) return defaultColor;
		try
		{
			return await this.twitchApi.chat.getColorForUser( userId ) || defaultColor;
		}
		catch ( error: unknown ) { log( error ) }
		return defaultColor;
	}

	/** Fetch twitch Emotes */
	async getEmotesTwitch(): Promise<TwitchEmote>
	{
		const emoteMap: TwitchEmote = {};
		try
		{
			const [ globalEmotes, channelEmotes ] = await Promise.all( [
				this.twitchApi.chat.getGlobalEmotes(),
				this.twitchApi.chat.getChannelEmotes( this.broadcasterId )
			] );

			globalEmotes.concat( channelEmotes ).forEach( ( emote ) =>
			{
				let url = emote.getAnimatedImageUrl( '3.0' );
				if ( !url ) url = emote.getFormattedImageUrl( '3.0' );
				emoteMap[emote.name] = url;
			} );

			return emoteMap;
		}
		catch ( error: unknown ) { log( error ) }
		return emoteMap;
	}

	/** Get config for single twitch event */
	getEvent( eventType: string )
	{
		if ( !eventType ) return {};
		return this.events.get( eventType ) || {};
	}

	/** Get last 10 saved events */
	getLastEventsData( streamLanguage: string = 'de' )
	{
		try
		{
			streamLanguage = streamLanguage || 'de';
			const events = this.db.queryEntries( `
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
			` ) as unknown as TwitchEventData[];

			for ( const [ index, event ] of events.entries() )
			{
				const eventConfig = this.getEvent( event.type as string );
				if ( eventConfig?.extra?.[streamLanguage] )
					events[index].extra = eventConfig.extra[streamLanguage];
			}
			return events;
		}
		catch ( error: unknown ) { log( error ) }
		return [];
	}

	/** Gets Twitch schedule
	 *
	 * @returns {Promise<TwitchStreamDate[]|[]>}
	 */
	async getSchedule(): Promise<TwitchStreamDate[] | []>
	{
		let schedule;
		try
		{
			schedule = await this.twitchApi.schedule.getSchedule(
				this.broadcasterId,
				{
					startDate: new Date().toISOString(),
					limit: 10,
					utcOffset: 1
				}
			);
			if ( !schedule || schedule?.data?.segments.length === 0 )
				return [];
		}
		catch ( error: unknown )
		{
			log( error );
			return [];
		}

		const dates: TwitchStreamDate[] = [];
		for ( const segment of schedule.data.segments )
		{
			const date: TwitchStreamDate = {
				title: segment.title,
				categoryName: segment.categoryName ?? '',
				startDate: segment.startDate.getTime() / 1000,
				endDate: segment.endDate.getTime() / 1000,
				isRecurring: segment.isRecurring,
				cancelEndDate: segment.cancelEndDate ?
					segment.cancelEndDate.getTime() / 1000 :
					0
			};

			dates.push( date );
		}

		return dates;
	}

	/** Get User Data from Twitch
	 *
	 * @param {string|HelixUser} user User ID, name or object
	 */
	async getUser( user?: string | HelixUser )
	{
		if ( user instanceof HelixUser )
			return user;

		if ( !user || user?.toLowerCase() === this.broadcasterName )
			return this.twitchUser;

		try
		{
			// Replace all non alphanumeric chars and underscore
			user = user.replaceAll( /(\W)+/gi, '' ).toLowerCase();
			return await this.twitchApi.users.getUserByName( user );
		}
		catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}

	/** Get data for twitch user/s
	 *
	 * @param {string} userId User ID
	 * @returns {TwitchUserData|undefined}
	 */
	getUserData( userId: string ): TwitchUserData | undefined
	{
		try
		{
			const result = this.db.preparedStatements.get( 'getUserData' )?.first( [ userId ] ) || [];
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
	getUsersData(): Map<string, TwitchUserData>
	{
		const users = new Map<string, TwitchUserData>();
		try
		{
			const results = this.db.queryEntries<TwitchUserData>( 'SELECT * FROM twitch_users' );

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
	isFollower( userId: string): boolean
	{
		const userData = this.getUserData( userId );
		return !!userData?.follow_date;
	}

	/** Set all twitch emotes */
	async setEmotes()
	{
		const [ emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV ] = await Promise.all( [
			this.getEmotesTwitch(),
			FrankerFaceZ.getEmotes( this.broadcasterId ),
			SevenTV.getEmotes(),
			BetterTTV.getEmotes( this.broadcasterId )
		] );
		const emotes = Object.assign(
			{},
			emotesTwitch,
			emotesFFZ,
			emotes7TV,
			emotesBTTV
		);

		this.emotes = objectToMap( emotes );
	}

	/** Set last 20 followers */
	async setFollowers()
	{
		const user = await this.getUser();
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
			if ( this.getUserData( follower.userId )?.follow_date )
				continue;

			this.addEvent( follow );
		}
	}

	/** Set channel mod list */
	async setMods()
	{
		try
		{
			const mods = await this.twitchApi.moderation.getModerators( this.broadcasterId );
			if ( mods.data.length === 0 )
				return;

			const modNicks = [];
			for ( const mod of mods.data )
				modNicks.push( mod.userName.toLowerCase() );

			// Add own botnick to list (not default)
			modNicks.push( this.broadcasterName );
			this.mods = modNicks;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Set/Update Channel points rewards */
	async setRewards()
	{
		try
		{
			const rewards = this.rewards;
			if ( !rewards ) return;

			const rewardsCurrent = await this.twitchApi.channelPoints
				.getCustomRewards( this.broadcasterId, true );

			// For testing
			// for ( const [ index, reward ] of rewardsCurrent.entries() )
			// {
			// 	log( `${reward.title} > ${reward.id}` );
			// }

			for ( const [ index, reward ] of rewards.entries() )
			{
				if ( reward.id === '' )
				{
					const rewardCreated = await this.twitchApi.channelPoints
						.createCustomReward( this.broadcasterId, reward );
					rewards[index].id = rewardCreated.id;
					log(
						`createCustomReward › ${getRewardSlug( reward.title )} › ${rewardCreated.id}`
					);
					this.saveFile( 'twitchRewards', rewards, 'config' );
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
							this.broadcasterId,
							reward.id.toString(),
							reward
						);
					}
				}
			}

			log( 'Rewards reloaded ♻️' );

			this.rewards = rewards;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Set Global Twitch Bot list */
	async setBots()
	{
		this.bots = await TwitchInsights.getBots();
	}

	/** Initially set main user object */
	async setUser()
	{
		try
		{
			this.twitchUser = await this.twitchApi.users.getUserByName( this.broadcasterName );
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/**
	 * Add user to DB
	 *
	 * @param {number} userId
	 * @param {string} userName
	 */
	addUserToDB( userId: number|string, userName: string ): TwitchUserData|undefined
	{
		try
		{
			this.db.query( 'INSERT OR IGNORE INTO twitch_users (id, name) VALUES (?, ?)', [ userId, userName ] );
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
		return undefined;
	}

	/** Add new event */
	addEvent( event: TwitchEventData )
	{
		if (
			// No id? Probably kofi event
			!event?.user?.id ||
			event.type?.startsWith( 'reward' ) ||
			this.eventExists( event )
		) return;

		// First try to add user to DB to prevent key constraint errors
		void this.addUserToDB( event.user.id, event.user.name );

		// Add to event table
		try
		{
			this.db.query(
				'INSERT INTO twitch_events (type, user_id, timestamp, count) VALUES (?, ?, ?, ?)',
				[ event.type, event.user.id, event.timestamp, event.count ?? 0 ]
			);
		}
		catch ( error: unknown ) { log( error ) }

		// Update user count data based on event
		this.updateUserCountData( event );
	}

	/**
	 * Update User count data based on event
	 *
	 * @param {} event
	 */
	updateUserCountData( event: TwitchEventData ): void
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
			this.updateUserData( event.user, type, value );
			if ( type === 'gift_count' )
				this.updateUserData( event.user, 'gift_subs', value );
			else if ( type === 'raid_count' )
				this.updateUserData( event.user, 'raid_viewers', value );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Check if an event already exists */
	eventExists( eventToCheck: TwitchEventData )
	{
		if ( !eventToCheck )
			return false;
		try
		{
			const events = this.db.queryEntries( `
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
							event.name == eventToCheck.user.name
						);
					}
					else
					{
						return (
							event.type === eventToCheck.type &&
							event.name == eventToCheck.user.name &&
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

	/** Check if user is Bot */
	isBot( userName: string )
	{
		if ( !userName ) return false;
		return this.bots.includes( userName.toLowerCase() );
	}

	/** Check if user is a mod */
	isMod( userName: string )
	{
		if ( !userName ) return false;
		return this.mods.includes( userName.toLowerCase() );
	}

	/** Update specific saved data from given user.
	 *
	 * @param {Object} user User object
	 * @param {string} dataName Name of data to update
	 * @param {string|int|boolean} dataValue New data value
	 */
	updateUserData(
		user: SimpleUser,
		dataName: string,
		dataValue: number = 1
	)
	{
		if ( !user?.id || !dataName ) return;

		try
		{
			let userData = this.getUserData( user.id );
			// Add user if not in DB
			if ( !userData )
			{
				userData = this.addUserToDB( user.id, user.name );
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

			this.db.preparedStatements.get( 'updateUserData' )?.execute( newUserData );

		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Update Stream stats
	 *
	 * @param {HelixUser|SimpleUser} user User Object
	 * @param {string} eventType
	 * @param {number} eventCount
	 */
	updateStreamStats(
		user: SimpleUser,
		eventType: string,
		eventCount: number = 1
	)
	{
		if ( !user?.id || !eventType ) return;

		try
		{
			this.db.query(
				`INSERT OR IGNORE INTO stream_stats (user_id) VALUES (?)`,
				[ user.id ]
			);

			switch ( eventType )
			{
				case 'first_chatter':
				{
					if ( this.firstChatter )
						return;
					this.db.query(
						`UPDATE stream_stats SET first_chatter = 1 WHERE user_id = ?`,
						[ user.id ]
					);
					break;
				}

				case 'follow':
					this.db.query(
						`UPDATE stream_stats SET follow = 1 WHERE user_id = ?`,
						[ user.id ]
					);
					break;

				case 'message':
					this.db.preparedStatements.get( 'updateStatsMessage' )?.execute( [ user.id ] );
					break;

				case 'cheer':
					this.db.query(
						`UPDATE stream_stats SET cheer = cheer + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'raid':
					this.db.query(
						`UPDATE stream_stats SET raid = raid + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'sub':
				case 'resub-1':
				case 'resub-2':
				case 'resub-3':
				case 'resub-4':
				case 'resub-5':
					this.db.query(
						`UPDATE stream_stats SET sub = sub + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'subgift':
				case 'communitysub-1':
				case 'communitysub-2':
				case 'communitysub-3':
				case 'communitysub-4':
				case 'communitysub-5':
				case 'communitysub-6':
				case 'communitysub-7':
					this.db.query(
						`UPDATE stream_stats SET subgift = subgift + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;
			}
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Save data to file
	 *
	 * @param {string} fileName Name of file to be saved
	 * @param {Object} fileData Data to be saved
	 * @param {string} folder
	 */
	saveFile(
		fileName: string,
		fileData: unknown = null,
		folder: string = 'data'
	): void
	{
		if ( !fileName || !fileData || !folder )
		{
			log( new Error( 'Missing file name/data/folder' ) );
			return;
		}

		const spacing = fileName.toLowerCase().includes( 'twitchbots' ) ? '' : '\t';

		try
		{
			Deno.writeTextFileSync(
				`./twitch-bot/${folder}/${fileName}.json`,
				JSON.stringify( fileData, null, spacing )
			);
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Reload all JSON data files and update class properties */
	reloadConfig(): void
	{
		try
		{
			const events = JSON.parse(
				Deno.readTextFileSync( '@config/twitchEvents.json' )
			);
			const rewards = JSON.parse(
				Deno.readTextFileSync( '@config/twitchRewards.json' )
			);
			const timers = JSON.parse(
				Deno.readTextFileSync( '@config/twitchTimers.json' )
			);

			this.events = objectToMap( events );
			this.rewards = rewards;
			this.timers = objectToMap( timers );

			log( 'Config reloaded ♻️' );
		}
		catch ( error ) { log( error ) }
	}

	/**
	 * Daily Cronjob Tasks
	 */
	cronjobDaily(): void
	{
		void this.reloadConfig()
		void this.init();
	}
}
