/**
 * Static data
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { BetterTTV } from '@modules/integrations/BetterTTV.ts';
import { log, objectToMap } from '@shared/helpers.ts';
import { FrankerFaceZ } from '@modules/integrations/FrankerFaceZ.ts';
import { HelixUser } from '@twurple/api';
import { SevenTV } from '@modules/integrations/SevenTV.ts';
import { StreamEvents } from '@modules/features/StreamEvents.ts';
import { UserData} from '@modules/features/UserData.ts';

import type { SimpleUser, TwitchEmote, TwitchEventData, TwitchStreamDate } from '@shared/types.ts';
import type { ApiClient } from '@twurple/api';

export class BotData
{
	public twitchUser: HelixUser | null = null;
	public emotes: Map<string, string> = new Map();

	constructor( public twitchApi: ApiClient ) {}

	public async init(): Promise<void>
	{
		await this.setUser();
		void this.setEmotes();
		void this.setFollowers();
	}

	/** Get own twitch user id */
	public static get botId(): string
	{
		return Deno.env.get( 'BOT_ID' ) || '';
	}

	/** Get own twitch user name */
	public static get botName(): string
	{
		return Deno.env.get( 'BOT_NAME' ) || '';
	}

	/** Get own twitch user id */
	public static get broadcasterId(): string
	{
		return Deno.env.get( 'BROADCASTER_ID' ) || '';
	}

	/** Get own twitch user id */
	public static get broadcasterName(): string
	{
		return Deno.env.get( 'BROADCASTER_NAME' ) || '';
	}

	/** Get color for user
	 *
	 * @param {string} userId User to get color from
	 */
	public async getColorForUser( userId: string ): Promise<string>
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
	private async getEmotesTwitch(): Promise<TwitchEmote>
	{
		const emoteMap: TwitchEmote = {};
		try
		{
			const [ globalEmotes, channelEmotes ] = await Promise.all( [
				this.twitchApi.chat.getGlobalEmotes(),
				this.twitchApi.chat.getChannelEmotes( BotData.broadcasterId )
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

	/** Gets Twitch schedule
	 *
	 * @returns {Promise<TwitchStreamDate[]|[]>}
	 */
	public async getSchedule(): Promise<TwitchStreamDate[] | []>
	{
		let schedule;
		try
		{
			schedule = await this.twitchApi.schedule.getSchedule(
				BotData.broadcasterId,
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
	public async getUser( user?: string | HelixUser ): Promise<HelixUser | null>
	{
		if ( user instanceof HelixUser )
			return user;

		if ( !user || user?.toLowerCase() === BotData.broadcasterName )
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

	/** Set all twitch emotes */
	private async setEmotes(): Promise<void>
	{
		const [ emotesTwitch, emotesFFZ, emotes7TV, emotesBTTV ] = await Promise.all( [
			this.getEmotesTwitch(),
			FrankerFaceZ.getEmotes( BotData.broadcasterId ),
			SevenTV.getEmotes(),
			BetterTTV.getEmotes( BotData.broadcasterId )
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
	private async setFollowers(): Promise<void>
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
			if ( UserData.get( follower.userId )?.follow_date )
				continue;

			StreamEvents.add( follow );
		}
	}

	/** Initially set main user object */
	public async setUser(): Promise<void>
	{
		try
		{
			this.twitchUser = await this.twitchApi.users.getUserByName( BotData.broadcasterName );
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
	 * @param {string} folder
	 */
	public static saveFile(
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

	/**
	 * Daily Cronjob Tasks
	 */
	public cronjobDaily(): void
	{
		void this.init();
	}
}
