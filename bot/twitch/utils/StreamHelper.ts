/**
 * Stream Helper functions
 *
 * @author Wellington Estevo
 * @version 2.4.0
 */

import { getMessage, log } from '@shared/helpers.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { StreamData, StreamDataApi } from '@shared/types.ts';
import type { HelixStream } from '@twurple/api';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class StreamHelper
{
	public stream: HelixStream | null = null;

	constructor( private twitch: Twitch ) {}

	/** Get the start time as timestamp */
	public get startTime(): number
	{
		return this.stream?.startDate.getTime() ?? 0;
	}

	/** Get current Stream language */
	public get language(): string
	{
		return this.stream?.language || 'de';
	}

	/** Returns if stream is active */
	public get isActive(): boolean
	{
		return this.stream !== null;
	}

	/** Set the current stream */
	public async set(
		stream?: HelixStream | undefined | null
	): Promise<HelixStream | null>
	{
		if ( typeof stream !== 'undefined' )
			return this.stream = stream;

		try
		{
			this.stream = await this.twitch.twitchApi.streams.getStreamByUserName(
				 UserHelper.broadcasterName
			);
			return this.stream;
		} catch ( error: unknown )
		{
			log( error );
			return null;
		}
	}


	/** Get the current stream for API */
	public forApi(): StreamDataApi | undefined
	{
		const stream = this.stream;
		if ( !stream ) return;

		return {
			gameName: stream.gameName,
			startDate: stream.startDate.getTime() / 1000,
			thumbnailUrl: stream.thumbnailUrl,
			title: stream.title,
			language: stream.language
		} as StreamDataApi;
	}

	/** Send Stream Online Data to discord
	 *
	 * @param {HelixStream} stream Current Stream
	 * @param {string} streamAnnouncementMessage
	 */
	public async sendStreamOnlineDataToDiscord(
		stream?: HelixStream | undefined | null,
		streamAnnouncementMessage: string = ''
	): Promise<void>
	{
		if ( !this.twitch.discord.client.isReady() ) return;

		stream = stream ? stream : this.stream;
		if ( !stream ) return;

		const user = await this.twitch.userHelper.getUser( stream.userName );
		if ( !user ) return;

		if ( !streamAnnouncementMessage )
		{
			streamAnnouncementMessage = getMessage(
				this.twitch.streamEvents.get( 'streamonline' ).message,
				this.language
			).replace( '[user]', user.displayName ) || `${ user.displayName } ist jetzt live!`;
		}

		const streamData: StreamData = {
			displayName: stream.userDisplayName,
			profilePictureUrl: user.profilePictureUrl,
			streamUrl: `https://twitch.tv/${ stream.userName }`,
			streamThumbnailUrl: stream?.thumbnailUrl ?
				stream.getThumbnailUrl( 800, 450 ) + `?id=${ stream.id }` :
				`${ Deno.env.get( 'PUBLIC_URL' )?.toString() }/assets/thumbnail-propz.jpg`,
			streamTitle: stream?.title ? stream.title : streamAnnouncementMessage,
			streamDescription: stream?.gameName ?
				stream.gameName :
				'Software & Game Development',
			streamAnnouncementMessage: streamAnnouncementMessage
		};

		console.table( streamData );
		this.twitch.discord.sendStreamOnlineMessage( streamData );
	}
}
