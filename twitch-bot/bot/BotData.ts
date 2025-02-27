/**
 * Static data
 * 
 * @author Wellington Estevo
 * @version 1.5.2
 */

import { getRandomNumber, getRewardSlug, log, objectToMap } from '@propz/helpers.ts';
import { HelixUser } from '@twurple/api';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';

import type { ApiClient } from '@twurple/api';
import type {
	SimpleUser,
	TwitchBadge,
	TwitchBadgeVersion,
	TwitchCredits,
	TwitchCreditsData,
	TwitchEmote,
	TwitchEventData,
	TwitchEvent,
	TwitchQuote,
	TwitchReaction,
	TwitchReward,
	TwitchStreamDate,
	TwitchTimers,
	TwitchUserData
} from '@propz/types.ts';
import type { PreparedQuery } from 'https://deno.land/x/sqlite/mod.ts';

// Config
import discordEvents from '../config/discordEvents.json' with { type: 'json' };
import events from '../config/twitchEvents.json' with { type: 'json' };
import reactions from '../config/twitchReactions.json' with { type: 'json' };
import rewards from '../config/twitchRewards.json' with { type: 'json' };
import timers from '../config/twitchTimers.json' with { type: 'json' };

// Data
import credits from '../data/twitchCredits.json' with { type: 'json' }
import eventsData from '../data/twitchEventsData.json' with { type: 'json' };

import { FrankerFaceZ } from '../external/FrankerFaceZ.ts';
import { SevenTV } from '../external/SevenTV.ts';
import { BetterTTV } from '../external/BetterTTV.ts';
import { TwitchInsights } from '../external/TwitchInsights.ts';

export class BotData
{
	public twitchApi: ApiClient;
	public db: DB;
	private preparedStatements: Map<string, any> = new Map();

	// Config
	public discordEvents: Map<string,TwitchEvent>;
	public events: Map<string,TwitchEvent>;
	public reactions: TwitchReaction[] = reactions;
	public rewards: TwitchReward[] = rewards;
	public timers: Map<string,TwitchTimers>;

	// Data
	public bots: string[] = [];
	public credits: TwitchCredits = credits;
	public emotes: Map<string,string> = new Map();
	public eventsData: TwitchEventData[] = eventsData;

	// Dynamic
	public twitchUser: HelixUser|null = null;
	public mods: string[] = [];
	public badges: TwitchBadge[] = [];
	public followers: TwitchEventData[] = [];

	constructor( twitchApi: ApiClient )
	{
		this.twitchApi = twitchApi;
		this.timers = objectToMap( timers );
		this.discordEvents = objectToMap( discordEvents );
		this.events = objectToMap( events );
		this.db = new DB( './twitch-bot/bot/BotData.sql' );
	}

	async init()
	{
		await this.setUser();
		//this.setBadges();
		this.setEmotes();
		this.setFollowers();
		this.setMods();
		this.setRewards();
		this.setBots();
		this.initDatabase();
		this.initPreparedStatements();
	}

	/** Get own twitch user display name */
	get userDisplayName() { return Deno.env.get('TWITCH_USER_DISPLAYNAME') || ''; }

	/** Get own twitch user id */
	get userId() { return Deno.env.get('TWITCH_USER_ID') || ''; }

	/** Get own twitch user name */
	get userName() { return Deno.env.get('TWITCH_USERNAME') || ''; }

	/** Get color for user
	 * 
	 * @param {string} userId User to get color from
	 */
	async getColorForUser( userId: string )
	{
		const defaultColor = '#C7C7F1';
		if ( !userId ) return defaultColor;
		return await this.twitchApi.chat.getColorForUser( userId ) || defaultColor;
	}

	/** Fetch twitch Emotes */
	async getEmotesTwitch(): Promise<TwitchEmote>
	{
		const [globalEmotes,channelEmotes] = await Promise.all([
			this.twitchApi.chat.getGlobalEmotes(),
			this.twitchApi.chat.getChannelEmotes( this.userId )
		]);

		const emoteMap: TwitchEmote = {};
		globalEmotes.concat( channelEmotes ).forEach( emote =>
		{
			let url = emote.getAnimatedImageUrl( '3.0' );
			if ( !url ) url = emote.getFormattedImageUrl( '3.0' );
			emoteMap[emote.name] = url;
		});

		return emoteMap;
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
		const quotes = this.db.queryEntries<TwitchQuote>( `
			SELECT 
				q.quote_id,
				q.date,
				q.category,
				q.quote,
				q.user_id,
				q.vod_url,
				u.username  -- Include the username from users table
			FROM 
				twitch_quotes q
			LEFT JOIN 
				twitch_users u ON q.user_id = u.user_id
			ORDER BY
				q.quote_id` );

		if ( quotes.length === 0 ) return '';

		const quoteIndex = quoteId > 0 ? quoteId : getRandomNumber( quotes.length, 1 );
		const quote = quotes[ quoteIndex ];

		if ( !quote ) return '';

		const date = new Date( Date.parse( quote.date ) );
		const message = `${ quote.quote } - ${ quote.username } [ #${ quoteIndex } / ${ date.toLocaleDateString( 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' } ) } / ${ quote.vod_url } ]`;

		return message;
	}

	/** Get last 10 saved events */
	getLastEventsData( streamLanguage: string = 'de' )
	{
		streamLanguage = streamLanguage || 'de';
		const eventsData = this.eventsData.slice(-10);
		for( const [index, event] of eventsData.entries() )
		{
			const eventSaved = this.getEvent( event.eventType );
			if ( eventSaved?.extra?.[ streamLanguage ] )
				eventsData[ index ].extra = eventSaved.extra[ streamLanguage ];
		}
		return eventsData;
	}

	/** Gets Twitch schedule
	 * 
	 * @returns {Promise<TwitchStreamDate[]|[]>}
	 */
	async getSchedule(): Promise<TwitchStreamDate[]|[]>
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
			if ( !schedule || schedule?.data?.segments.length === 0 ) return [];
		}
		catch( error: unknown ) {
			log( error );
			return [];
		}

		const dates: TwitchStreamDate[] = [];
		for( const segment of schedule.data.segments )
		{
			const date: TwitchStreamDate = {
				'title': segment.title,
				'categoryName': segment.categoryName ?? '',
				'startDate': segment.startDate.getTime() / 1000,
				'endDate': segment.endDate.getTime() / 1000,
				'isRecurring': segment.isRecurring,
				'cancelEndDate': segment.cancelEndDate ? segment.cancelEndDate.getTime() / 1000 : 0
			};

			dates.push( date );
		}

		return dates;
	}

	/** Returns twitch schedule ical */
	async getScheduleIcal()
	{
		try
		{
			return await this.twitchApi.schedule.getScheduleAsIcal( this.userId );
		}
		catch( error: unknown ) {
			log( error );
			return '';
		}
	}

	/** Get User Data from Twitch
	 * 
	 * @param {string|HelixUser} user User ID, name or object
	 */
	async getUser( user?: string|HelixUser )
	{
		if ( user instanceof HelixUser ) return user;
		if (
			!user ||
			user.toLowerCase() === this.userName
		) return this.twitchUser;

		try
		{
			return await this.twitchApi.users.getUserByName( user.toLowerCase() );
		}
		catch( error: unknown ) {
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
		if ( !userId ) return;
		const result = this.executeStatement( 'get_user', userId );
		if ( !result?.[0] ) return;
		return {
			user_id: result[0][0],
			username: result[0][1],
			follow_date: result[0][2],
			message_count: result[0][3],
			first_count: result[0][4]
		} as TwitchUserData;
	}

	/** Get data for twitch user/s
	 * 
	 * @returns {Map<number,TwitchUserData>}
	 */
	getUsersData()
	{
		const users = new Map<string, TwitchUserData>();
		const results = this.db.queryEntries<TwitchUserData>( 'SELECT * FROM twitch_users' );
		if ( !results || results.length === 0 ) return users;

		for( const user of results )
		{
			users.set( user.user_id, {
				user_id: user.user_id,
				username: user.username,
				follow_date: user.follow_date,
				message_count: user.message_count,
				first_count: user.first_count
			});
		}

		return users;
	}

	/** Reset all Credits stats */
	resetCredits()
	{
		for( const creditCat of Object.keys( this.credits ) )
		{
			this.credits[ creditCat ] = {}
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
		const channelBadges = await this.twitchApi.chat.getChannelBadges( this.userId );
		const globalBadges = await this.twitchApi.chat.getGlobalBadges();
		if ( !channelBadges && !globalBadges ) return;

		const badges = [];
		for( const badge of [ ...channelBadges, ...globalBadges ] )
		{
			const versions = [];
			for( const badgeVersion of badge.versions )
			{
				const ev: TwitchBadgeVersion = {
					id: badgeVersion.id,
					name: badgeVersion.title,
					url: badgeVersion.getImageUrl( 2 )
				}
				versions.push( ev );
			}

			const e: TwitchBadge = {
				id: badge.id,
				versions: versions
			}
	
			badges.push( e );
		}

		this.badges = badges;
	}

	/** Set all twitch emotes */
	async setEmotes()
	{
		const [ emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV ] = await Promise.all([
			this.getEmotesTwitch(),
			FrankerFaceZ.getEmotes( this.userId ),
			SevenTV.getEmotes(),
			BetterTTV.getEmotes( this.userId )
		]);
		const emotes = Object.assign( {}, emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV );

		this.emotes = objectToMap( emotes );
	}

	/** Set last 20 followers */
	async setFollowers()
	{
		const user = await this.getUser();
		if ( !user ) return;

		const followers = await user.getChannelFollowers();
		if ( !followers.data ) return;

		const followersData: TwitchEventData[] = [];
		for( const follower of followers.data )
		{
			const followTimestamp = follower.followDate.getTime() / 1000;
			const followerData: SimpleUser = {
				id: follower.userId,
				name: follower.userName,
				displayName: follower.userDisplayName
			}
			const follow: TwitchEventData = {
				eventType: 'follow',
				eventUsername: follower.userDisplayName,
				eventTimestamp: followTimestamp,
				extra: this.getEvent( 'follow' )!.extra!.de
			}

			followersData.push( follow );
			
			// Follower already exists
			if ( this.getUserData( follower.userId )?.follow_date ) continue;
			
			this.addEvent( follow );
			this.updateUserData( followerData, 'follow_date', followTimestamp );
		}

		this.followers = followersData;
		this.saveUsersAndEventsData();
	}

	/** Set channel mod list */
	async setMods()
	{
		const mods = await this.twitchApi.moderation.getModerators( this.userId );
		if ( mods.data.length === 0 ) return;

		const modNicks = [];
		for( const mod of mods.data )
		{
			modNicks.push( mod.userName.toLowerCase() );
		}

		// Add own botnick to list (not default)
		modNicks.push( this.userName );
		this.mods = modNicks;
	}

	/** Set/Update Channel points rewards */
	async setRewards()
	{
		const rewards = this.rewards;
		const rewardsCurrent = await this.twitchApi.channelPoints.getCustomRewards( this.userId, true );

		for( const [index,reward] of rewards.entries() )
		{
			if ( reward.id === '' )
			{
				try
				{
					const rewardCreated = await this.twitchApi.channelPoints.createCustomReward( this.userId, reward );
					rewards[ index ].id = rewardCreated.id;
					log( `createCustomReward › ${ getRewardSlug( reward.title ) } › ${rewardCreated.id}` );
					this.saveFile( 'twitchRewards', rewards, 'config' );
				}
				catch( error: unknown ) { log( error ) }
			}
			else
			{
				const rewardExists = rewardsCurrent.findIndex( item => item.id === reward.id );
				if ( !rewardExists ) continue;

				const rewardCurrent = rewardsCurrent[ rewardExists ];
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
					try
					{
						this.twitchApi.channelPoints.updateCustomReward( this.userId, reward.id.toString(), reward );
					}
					catch( error: unknown ) { log( error ) }
				}
			}
		}

		this.rewards = rewards;
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
		catch( error: unknown ) { log( error ) }
	}

	/** Add new event
	 * 
	 * @param {HelixUser} user User object
	 * @param {string} eventType Event name
	 * @param {int} eventCount Event count value
	 */
	addEvent( event: TwitchEventData )
	{
		if (
			!event ||
			event.eventType?.startsWith( 'reward' ) ||
			this.eventExists( event )
		) return;
		if ( event.eventCount === 0 ) delete( event.eventCount );
		this.eventsData.push( event );
		this.eventsData.sort( (a, b) => a.eventTimestamp - b.eventTimestamp );
	}
	
	/** Add quote to quotes */
	addQuote( quote: TwitchQuote )
	{
		if ( !quote ) return '';
		this.db.query( `INSERT INTO twitch_quotes (date, category, quote, user_id, vod_url) VALUES (?, ?, ?, ?, ?)`, [ quote.date, quote.category, quote.quote, quote.user_id, quote.vod_url ] );
		return this.db.lastInsertRowId.toString();
	}

	/** Check if an event already exists */
	eventExists( eventToCheck: TwitchEventData )
	{
		if ( !eventToCheck ) return false;
		return this.eventsData.some(
			(event) => {
				if ( event.eventType === 'follow' )
				{
					return (
						event.eventType === eventToCheck.eventType &&
						event.eventUsername == eventToCheck.eventUsername
					);
				}
				else
				{
					return (
						event.eventType === eventToCheck.eventType &&
						event.eventUsername == eventToCheck.eventUsername &&
						event.eventCount === eventToCheck.eventCount &&
						(
							event.eventTimestamp === eventToCheck.eventTimestamp ||
							event.eventTimestamp === eventToCheck.eventTimestamp + 1 ||
							event.eventTimestamp === eventToCheck.eventTimestamp - 1
						)
					);
				}
			}
		);
	}

	/** Check if user is Bot */
	isBot( userName: string )
	{
		if ( !userName ) return false;
		return this.bots.includes( userName.toLowerCase() );
	}

	/**
	 * Check if user is a mod
	 * 
	 * @param {string} userName User to check
	 */
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
	updateUserData( user: HelixUser|SimpleUser, dataName: string, dataValue: string|number = '' )
	{
		if ( !user?.id || !dataName ) return;

		const userData = this.getUserData( user.id );
		if ( !userData ) this.executeStatement( 'add_user', user.id );

		// Always update username, could change frequently
		this.executeStatement( 'update_username', [ user.displayName, user.id ] );

		// Types that need count up
		if ( [ 'message_count', 'first_count' ].includes( dataName ) )
		{
			this.executeStatement( dataName, user.id );
			return;
		}

		this.executeStatement( dataName, [ dataValue.toString() ?? '', user.id ] );
	}

	/** Update credits
	 * 
	 * @param {HelixUser|SimpleUser} user User Object
	 * @param {string} eventName Name of Event
	 * @param {number} count Event Count
	 */
	updateCredits( user: SimpleUser, eventType: string, eventCount: number = 1 )
	{
		const data: TwitchCreditsData = {
			profilePictureUrl: user.profilePictureUrl || '',
			color: user.color || '#C7C7F1'
		}

		switch ( eventType )
		{
			case 'firstchatter':
				if ( Object.keys( this.credits?.firstchatter ).length > 0 ) return;
				this.credits.firstchatter[ user.displayName ] = data;
				break;

			case 'follow':
				this.credits.follow[ user.displayName ] = data;
				break;

			case 'message':
				if ( this.credits?.message?.[ user.displayName ]?.count )
					eventCount = this.credits.message[ user.displayName ].count! + eventCount;

				data.count = eventCount;
				this.credits.message[ user.displayName ] = data;
				break;

			case 'cheer':
				if ( this.credits?.cheer?.[ user.displayName ]?.count )
					eventCount = this.credits.cheer[ user.displayName ].count! + eventCount;

				data.count = eventCount;
				this.credits.cheer[ user.displayName ] = data;
				break;
		
			case 'raid':
				data.count = eventCount;
				this.credits.raid[ user.displayName ] = data;
				break;

			case 'sub':
			case 'resub-1':
			case 'resub-2':
			case 'resub-3':
				if ( this.credits?.sub?.[ user.displayName ]?.count )
					eventCount = this.credits.sub[ user.displayName ].count! + eventCount;

				data.count = eventCount;
				this.credits.sub[ user.displayName ] = data;
				break;

			case 'subgift':
			case 'communitysub':
				if ( this.credits?.subgift?.[ user.displayName ]?.count )
					eventCount = this.credits.subgift[ user.displayName ].count! + eventCount;

				data.count = eventCount;
				this.credits.subgift[ user.displayName ] = data;
				break;
		}
	}

	/** Save users and events data */
	saveUsersAndEventsData()
	{
		this.saveFile( 'twitchEventsData', this.eventsData );
		this.saveFile( 'twitchCredits', this.credits );
	}

	/** Save data to file
	 * 
	 * @param {string} fileName Name of file to be saved
	 * @param {Object} fileData Data to be saved
	 */
	saveFile( fileName: string, fileData: unknown = null, folder: string = 'data' )
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
		catch ( error: unknown ) { log( error ); }
	}

	/** Reload all JSON data files and update class properties */
	reloadData()
	{
		try {
			const discordEvents = JSON.parse( Deno.readTextFileSync( './twitch-bot/config/discordEvents.json' ));
			const events = JSON.parse( Deno.readTextFileSync( './twitch-bot/config/twitchEvents.json' ));
			const reactions = JSON.parse( Deno.readTextFileSync( './twitch-bot/config/twitchReactions.json' ));
			const rewards = JSON.parse( Deno.readTextFileSync( './twitch-bot/config/twitchRewards.json' ));
			const timers = JSON.parse( Deno.readTextFileSync( './twitch-bot/config/twitchTimers.json' ));

			this.discordEvents = objectToMap( discordEvents );
			this.events = objectToMap( events );
			this.reactions = reactions;
			this.rewards = rewards;
			this.timers = objectToMap( timers );

			this.setRewards();
		}
		catch (error) { log(error) }
	}

	/** Initialize commonly used prepared statements */
	initPreparedStatements()
	{
		// User operations
		this.preparedStatements.set( 'add_user', 
			this.db.prepareQuery( 'INSERT OR IGNORE INTO twitch_users (user_id) VALUES (?)' ) );

		this.preparedStatements.set( 'get_user', 
			this.db.prepareQuery( 'SELECT user_id, username, follow_date, message_count, first_count FROM twitch_users WHERE user_id = ?' ) );

		this.preparedStatements.set( 'update_username', 
			this.db.prepareQuery( 'UPDATE twitch_users SET username = ? WHERE user_id = ?' ) );
	
		this.preparedStatements.set( 'follow_date', 
			this.db.prepareQuery( 'UPDATE twitch_users SET follow_date = ? WHERE user_id = ?' ) );

		this.preparedStatements.set( 'message_count', 
			this.db.prepareQuery( 'UPDATE twitch_users SET message_count = message_count + 1 WHERE user_id = ?' ) );
		
		this.preparedStatements.set( 'first_count', 
			this.db.prepareQuery( 'UPDATE twitch_users SET first_count = first_count + 1 WHERE user_id = ?' ) );
		
		// Event operations
		this.preparedStatements.set( 'add_event', 
			this.db.prepareQuery( 'INSERT INTO twitch_events (event_type, user_id, timestamp, count, title_alert, title_event) VALUES (?, ?, ?, ?, ?, ?)' ) );
	}

	/** Use a prepared statement from the map
	 * 
	 * @param {string} statementName
	 * @param {string[]} params
	*/
	executeStatement( statementName: string, params: any = '' ): any[]
	{
		if ( !statementName ) return [];
		if ( !Array.isArray( params ) ) params = [ params ];

		const stmt = this.preparedStatements.get( statementName ) as PreparedQuery;
		if ( !stmt ) return [];

		try
		{
			const results = stmt.execute( params );
			// For statements that don't return rows (INSERT, UPDATE, DELETE)
			// we can provide useful information		
			if (
				typeof results === 'undefined' ||
				( Array.isArray( results ) && results.length === 0 )
			)
			{
				// For operations that might create a new row
				if ( statementName.toLowerCase().includes('add'))
					return [ this.db.lastInsertRowId ];
				
				// For operations that might modify existing rows
				if (
					statementName.toLowerCase().includes('update') ||
					statementName.toLowerCase().includes('delete')
				)
					return [ this.db.changes ];
			}

			return Array.isArray( results ) ? results : [ results ];
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	public cleanup() {
		// Finalize all prepared statements
		for (const [name, stmt] of this.preparedStatements.entries()) {
			try {
				stmt.finalize();
			} catch (error) {
				log(`Error finalizing statement "${name}": ${error}`);
			}
		}
		this.preparedStatements.clear();
		
		// Close the database connection
		if (this.db) {
			this.db.close();
		}
	}

	// ********************

	/** Init Database */
	initDatabase()
	{
		if ( !this.db ) return;

		this.db.execute(`
			-- Twitch Users Table
			CREATE TABLE IF NOT EXISTS twitch_users (
				user_id TEXT PRIMARY KEY,
				username TEXT UNIQUE DEFAULT '',
				follow_date INTEGER DEFAULT 0,
				message_count INTEGER DEFAULT 0,
				first_count INTEGER DEFAULT 0
			);
			CREATE INDEX IF NOT EXISTS idx_users_username ON twitch_users(username);
			CREATE INDEX IF NOT EXISTS idx_users_follow_date ON twitch_users(follow_date);

			-- Twitch Events Table
			CREATE TABLE IF NOT EXISTS twitch_events (
				event_id INTEGER PRIMARY KEY AUTOINCREMENT,
				event_type TEXT NOT NULL,
				user_id TEXT NOT NULL,
				timestamp INTEGER NOT NULL,
				count INTEGER,
				title_alert TEXT,
				title_event TEXT,
				FOREIGN KEY (user_id) REFERENCES twitch_users(user_id)
			);
			CREATE INDEX IF NOT EXISTS idx_events_type ON twitch_events(event_type);
			CREATE INDEX IF NOT EXISTS idx_events_user_id ON twitch_events(user_id);
			CREATE INDEX IF NOT EXISTS idx_events_timestamp ON twitch_events(timestamp);

			-- Twitch Quotes Table
			CREATE TABLE IF NOT EXISTS twitch_quotes (
				quote_id INTEGER PRIMARY KEY AUTOINCREMENT,
				date TEXT NOT NULL,
				category TEXT,
				quote TEXT NOT NULL,
				user_id TEXT NOT NULL,
				vod_url TEXT,
				FOREIGN KEY (user_id) REFERENCES twitch_users(user_id)
			);
			CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON twitch_quotes(user_id);
			CREATE INDEX IF NOT EXISTS idx_quotes_category ON twitch_quotes(category);
			CREATE INDEX IF NOT EXISTS idx_quotes_date ON twitch_quotes(date);
		`);
	}
}