/**
 * Static data
 *
 * @author Wellington Estevo
 * @version 1.6.8
 */

import { getRandomNumber, getRewardSlug, log, objectToMap } from '@propz/helpers.ts';
import { HelixUser } from '@twurple/api';

import type { SimpleUser, TwitchBadge, TwitchBadgeVersion, TwitchEmote, TwitchEvent, TwitchEventData, TwitchQuote, TwitchQuoteRow, TwitchReaction, TwitchReward, TwitchStreamDate, TwitchTimers, TwitchUserData } from '@propz/types.ts';
import type { ApiClient } from '@twurple/api';
import type { Database } from './Database.ts';

// Config
import discordEvents from '../config/discordEvents.json' with { type: 'json' };
import events from '../config/twitchEvents.json' with { type: 'json' };
import reactions from '../config/twitchReactions.json' with { type: 'json' };
import rewards from '../config/twitchRewards.json' with { type: 'json' };
import timers from '../config/twitchTimers.json' with { type: 'json' };

import { BetterTTV } from '../external/BetterTTV.ts';
import { FrankerFaceZ } from '../external/FrankerFaceZ.ts';
import { SevenTV } from '../external/SevenTV.ts';
import { TwitchInsights } from '../external/TwitchInsights.ts';

export class BotData
{
	public twitchApi: ApiClient;
	public db: Database;

	// Config
	public discordEvents: Map<string, TwitchEvent>;
	public events: Map<string, TwitchEvent>;
	public reactions: TwitchReaction[] = reactions;
	public rewards: TwitchReward[] = rewards;
	public timers: Map<string, TwitchTimers>;

	// Dynamic
	public twitchUser: HelixUser | null = null;
	public mods: string[] = [];
	public badges: TwitchBadge[] = [];
	public followers: TwitchEventData[] = [];
	public emotes: Map<string, string> = new Map();
	public bots: string[] = [];

	constructor( twitchApi: ApiClient, db: Database )
	{
		this.twitchApi = twitchApi;
		this.db = db;
		this.timers = objectToMap( timers );
		this.discordEvents = objectToMap( discordEvents );
		this.events = objectToMap( events );
	}

	async init()
	{
		await this.setUser();
		// this.setBadges();
		this.setEmotes();
		this.setFollowers();
		this.setMods();
		this.setRewards();
		this.setBots();
	}

	/** Get own twitch user display name */
	get userDisplayName()
	{
		return Deno.env.get( 'TWITCH_USER_DISPLAYNAME' ) || '';
	}

	/** Get own twitch user id */
	get userId()
	{
		return Deno.env.get( 'TWITCH_USER_ID' ) || '';
	}

	/** Get own twitch user name */
	get userName()
	{
		return Deno.env.get( 'TWITCH_USERNAME' ) || '';
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
			const stats = this.db.queryEntries( `
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

			return stats;
		}
		catch ( error: unknown )
		{
			log( error );
			return [];
		}
	}

	/** Get color for user
	 *
	 * @param {string} userId User to get color from
	 */
	async getColorForUser( userId: string )
	{
		const defaultColor = '#C7C7F1';
		if ( !userId )
			return defaultColor;
		try
		{
			return await this.twitchApi.chat.getColorForUser( userId ) || defaultColor;
		}
		catch ( error: unknown )
		{
			log( error );
			return defaultColor;
		}
	}

	/** Fetch twitch Emotes */
	async getEmotesTwitch(): Promise<TwitchEmote>
	{
		const emoteMap: TwitchEmote = {};
		try
		{
			const [ globalEmotes, channelEmotes ] = await Promise.all( [
				this.twitchApi.chat.getGlobalEmotes(),
				this.twitchApi.chat.getChannelEmotes( this.userId )
			] );

			globalEmotes.concat( channelEmotes ).forEach( ( emote ) =>
			{
				let url = emote.getAnimatedImageUrl( '3.0' );
				if ( !url ) url = emote.getFormattedImageUrl( '3.0' );
				emoteMap[emote.name] = url;
			} );

			return emoteMap;
		}
		catch ( error: unknown )
		{
			log( error );
			return emoteMap;
		}
	}

	/** Get config for single twitch event */
	getEvent( eventType: string )
	{
		if ( !eventType ) return {};
		return this.events.get( eventType ) || {};
	}

	/** Get random quote */
	getQuote( quoteId: number = 0 )
	{
		try
		{
			let quoteIndex = quoteId;
			if ( quoteIndex < 1 )
			{
				const totalQuotes = this.db.queryEntries( `SELECT COUNT(*) as count FROM twitch_quotes` );

				if ( !totalQuotes?.[0]?.count )
					return '';

				quoteIndex = getRandomNumber( Number( totalQuotes[0].count ), 1 );
			}

			const quote = this.db.queryEntries<TwitchQuoteRow>( `
				SELECT 
					q.id,
					q.date,
					q.category,
					q.text,
					q.user_id,
					q.vod_url,
					u.name  -- Include the username from users table
				FROM twitch_quotes q
				LEFT JOIN twitch_users u ON q.user_id = u.id
				WHERE q.id = ?
				ORDER BY q.id`, [ quoteIndex ] );

			if ( quote.length === 0 )
				return '';

			const date = new Date( Date.parse( quote[0].date ) );
			let message = `${quote[0].text} - ${quote[0].name} [ #${quoteIndex} / ${
				date.toLocaleDateString( 'de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				} )
			}`;

			if ( quote[0].vod_url )
				message += ` / ${quote[0].vod_url}`;

			return message + ' ]';
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
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
		catch ( error: unknown )
		{
			log( error );
			return [];
		}
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
				this.userId,
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

		if ( !user || user?.toLowerCase() === this.userName )
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
	getUserData( userId: string )
	{
		try
		{
			const result = this.db.preparedStatements.get( 'get_user' )?.first( [ userId ] ) || [];

			if ( !result || result.length === 0 )
				return;

			return {
				id: result[0],
				name: result[1],
				profile_picture: result[2],
				color: result[3],
				follow_date: result[4],
				message_count: result[5],
				first_count: result[6]
			} as TwitchUserData;
		}
		catch ( error: unknown )
		{
			log( error );
			return;
		}
	}

	/** Get data for twitch user/s
	 *
	 * @returns {Map<number,TwitchUserData>}
	 */
	getUsersData()
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
					follow_date: user.follow_date,
					message_count: user.message_count,
					first_count: user.first_count
				} );
			}

			return users;
		}
		catch ( error: unknown )
		{
			log( error );
			return users;
		}
	}

	/** Set all twitch channel badges
	 *
	 * {
	 * 		id: 'bits',
	 * 		versions: [
	 * 			{
	 * 				id: 'xxx',
	 * 				name: 'name',
	 * 				url: 'https...'
	 * 			}, ...
	 * 		]
	 * }, ...
	 */
	async setBadges()
	{
		try
		{
			const channelBadges = await this.twitchApi.chat.getChannelBadges( this.userId );
			const globalBadges = await this.twitchApi.chat.getGlobalBadges();

			if ( !channelBadges && !globalBadges )
				return;

			const badges = [];
			for ( const badge of [ ...channelBadges, ...globalBadges ] )
			{
				const versions = [];
				for ( const badgeVersion of badge.versions )
				{
					const ev: TwitchBadgeVersion = {
						id: badgeVersion.id,
						name: badgeVersion.title,
						url: badgeVersion.getImageUrl( 2 )
					};
					versions.push( ev );
				}

				const e: TwitchBadge = {
					id: badge.id,
					versions: versions
				};

				badges.push( e );
			}

			this.badges = badges;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Set all twitch emotes */
	async setEmotes()
	{
		const [ emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV ] = await Promise.all( [
			this.getEmotesTwitch(),
			FrankerFaceZ.getEmotes( this.userId ),
			SevenTV.getEmotes(),
			BetterTTV.getEmotes( this.userId )
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
		if ( !user )
			return;

		const followers = await user.getChannelFollowers();
		if ( !followers.data )
			return;

		const followersData: TwitchEventData[] = [];
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
				user_id: follower.userId,
				timestamp: followTimestamp
			};

			followersData.push( follow );

			// Follower already exists
			if ( this.getUserData( follower.userId )?.follow_date )
				continue;

			this.addEvent( follow );
			this.updateUserData( followerData, 'follow_date', followTimestamp );
		}

		this.followers = followersData;
	}

	/** Set channel mod list */
	async setMods()
	{
		try
		{
			const mods = await this.twitchApi.moderation.getModerators( this.userId );
			if ( mods.data.length === 0 )
				return;

			const modNicks = [];
			for ( const mod of mods.data )
				modNicks.push( mod.userName.toLowerCase() );

			// Add own botnick to list (not default)
			modNicks.push( this.userName );
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
				.getCustomRewards( this.userId, true );

			for ( const [ index, reward ] of rewards.entries() )
			{
				if ( reward.id === '' )
				{
					const rewardCreated = await this.twitchApi.channelPoints
						.createCustomReward( this.userId, reward );
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
							this.userId,
							reward.id.toString(),
							reward
						);
					}
				}
			}

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
			this.twitchUser = await this.twitchApi.users.getUserByName( this.userName );
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Add new event */
	addEvent( event: TwitchEventData )
	{
		if (
			!event ||
			event.type?.startsWith( 'reward' ) ||
			this.eventExists( event )
		)
		{
			return;
		}

		try
		{
			// Insert user first if not exists (SQLite foreign key problem)
			this.db.preparedStatements.get( 'add_user' )?.execute( [ event.user_id ] );
			this.db.query(
				`INSERT INTO twitch_events (type, user_id, timestamp, count) VALUES (?, ?, ?, ?)`,
				[ event.type, event.user_id, event.timestamp, event.count || 0 ]
			);
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Add quote to quotes */
	addQuote( quote: TwitchQuote )
	{
		if ( !quote ) return '';

		try
		{
			this.db.query(
				`INSERT INTO twitch_quotes (date, category, text, user_id, vod_url) VALUES (?, ?, ?, ?, ?)`,
				[ quote.date, quote.category, quote.text, quote.user_id, quote.vod_url ]
			);
			return ( this.db.lastInsertRowId - 1 ).toString();
		}
		catch ( error: unknown )
		{
			log( error );
			return '';
		}
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
							event.name == eventToCheck.name
						);
					}
					else
					{
						return (
							event.type === eventToCheck.type &&
							event.name == eventToCheck.name &&
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
		catch ( error: unknown )
		{
			log( error );
			return false;
		}
	}

	/** Check if user is Bot */
	isBot( userName: string )
	{
		if ( !userName )
			return false;
		return this.bots.includes( userName.toLowerCase() );
	}

	/** Check if user is a mod */
	isMod( userName: string )
	{
		if ( !userName )
			return false;
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
		dataValue: string | number = ''
	)
	{
		if ( !user?.id || !dataName )
			return;

		try
		{
			const userData = this.getUserData( user.id );
			// Add user if not in DB
			if ( !userData )
				this.db.preparedStatements.get( 'add_user' )?.execute( [ user.id ] );

			const newUserData = [
				user.displayName,
				user.profilePictureUrl || '',
				user.color || '#C7C7F1',
				dataName === 'follow_date' && !userData?.follow_date ?
					dataValue :
					( userData?.follow_date || 0 ),
				dataName === 'message_count' ?
					( userData?.message_count || 0 ) + 1 :
					( userData?.message_count || 0 ),
				dataName === 'first_count' ?
					( userData?.first_count || 0 ) + 1 :
					( userData?.first_count || 0 ),
				user.id
			];

			this.db.preparedStatements.get( 'update_userdata' )?.execute( newUserData );
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Update Stream stats
	 *
	 * @param {HelixUser|SimpleUser} user User Object
	 * @param {string} eventName Name of Event
	 * @param {number} count Event Count
	 */
	updateStreamStats(
		user: SimpleUser,
		eventType: string,
		eventCount: number = 1
	)
	{
		if ( !user?.id || !eventType )
			return;

		try
		{
			this.db.query( `INSERT OR IGNORE INTO stream_stats (user_id) VALUES (?)`, [
				user.id
			] );

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
					this.db.preparedStatements.get( 'update_stats_message' )?.execute( [
						user.id
					] );
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
					this.db.query(
						`UPDATE stream_stats SET sub = sub + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;

				case 'subgift':
				case 'communitysub':
					this.db.query(
						`UPDATE stream_stats SET subgift = subgift + ? WHERE user_id = ?`,
						[ eventCount, user.id ]
					);
					break;
			}
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Save data to file
	 *
	 * @param {string} fileName Name of file to be saved
	 * @param {Object} fileData Data to be saved
	 */
	saveFile(
		fileName: string,
		fileData: unknown = null,
		folder: string = 'data'
	)
	{
		if ( !fileName || !fileData || !folder )
		{
			log( new Error( 'Missing file name/data/folder' ) );
			return;
		}

		const spacing = fileName.toLowerCase().includes( 'twitchbots' ) ? '' : '\t';

		try
		{
			Deno.writeTextFile(
				`./twitch-bot/${folder}/${fileName}.json`,
				JSON.stringify( fileData, null, spacing )
			);
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Reload all JSON data files and update class properties */
	reloadConfig()
	{
		try
		{
			const discordEvents = JSON.parse(
				Deno.readTextFileSync( './twitch-bot/config/discordEvents.json' )
			);
			const events = JSON.parse(
				Deno.readTextFileSync( './twitch-bot/config/twitchEvents.json' )
			);
			const reactions = JSON.parse(
				Deno.readTextFileSync( './twitch-bot/config/twitchReactions.json' )
			);
			const rewards = JSON.parse(
				Deno.readTextFileSync( './twitch-bot/config/twitchRewards.json' )
			);
			const timers = JSON.parse(
				Deno.readTextFileSync( './twitch-bot/config/twitchTimers.json' )
			);

			this.discordEvents = objectToMap( discordEvents );
			this.events = objectToMap( events );
			this.reactions = reactions;
			this.rewards = rewards;
			this.timers = objectToMap( timers );

			this.setRewards();
		}
		catch ( error )
		{
			log( error );
		}
	}
}
