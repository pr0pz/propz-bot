/**
 * YouTube Controller
 * 
 * https://developers.google.com/youtube/v3/docs/search/list#usage
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import type { YoutubeApiResponse } from '@propz/types.ts';
import { log } from '@propz/helpers.ts';

export class Youtube
{
	/** Get Youtube VOD link */
	public static async getVodLink( isStreamActive: boolean )
	{
		const vodId = isStreamActive ?
			await this.getCurrentLivestreamVideoId():
			await this.getLastLivestreamVideoId();

		return this.getYoutubeVideoUrlById( vodId );
	}
	
	/** Get ID of current livestream */
	public static async getCurrentLivestreamVideoId()
	{
		const ytApiKey = Deno.env.get( 'YOUTUBE_API_KEY' ) || '';
		const ytChannelId = Deno.env.get( 'YOUTUBE_CHANNEL_ID' ) || '';
		try
		{
			const response: Response = await fetch(
				`https://www.googleapis.com/youtube/v3/search?key=${ ytApiKey }&channelId=${ ytChannelId }&eventType=live&type=video&part=id&maxResults=1`
			);
			if ( !response.ok ) return '';

			const data: YoutubeApiResponse = await response.json();
			return data?.items?.[0]?.id?.videoId || '';
		}
		catch( error: unknown ) {
			log( error );
			return '';
		}
	}

	/** Get ID of last vod */
	public static async getLastLivestreamVideoId()
	{
		const ytApiKey = Deno.env.get( 'YOUTUBE_API_KEY' ) || '';
		const ytChannelId = Deno.env.get( 'YOUTUBE_CHANNEL_ID' ) || '';
		try
		{
			const response: Response = await fetch(
				`https://www.googleapis.com/youtube/v3/search?key=${ ytApiKey }&channelId=${ ytChannelId }&eventType=completed&type=video&part=snippet&maxResults=1&order=date`
			);
			if ( !response.ok ) return '';

			const data: YoutubeApiResponse = await response.json();
			return data?.items?.[0]?.id?.videoId || '';
		}
		catch( error: unknown ) {
			log( error );
			return '';
		}
	}

	/** Setup Youtube video url by ID and timestamp
	 * 
	 * @param {string} videoId - ID of video
	 * @param {number} videoTimestamp - timestamp to start video
	 */
	public static getYoutubeVideoUrlById( videoId: string = '', videoTimestamp: number = 0 )
	{
		if ( !videoId ) return '';
		let videoUrl: string = `https://www.youtube.com/watch?v=${ videoId }`;

		if ( !isNaN(videoTimestamp) && videoTimestamp > 0 )
			videoUrl += `&t=${ videoTimestamp }s`;

		return videoUrl;
	}
}