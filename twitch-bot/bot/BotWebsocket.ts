/**
 * Websocket Handler
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import '@shared/prototypes.ts';
import { log } from '@shared/helpers.ts';
import type { ObsData, SimpleUser, TwitchEventExtra, WebSocketData } from '@shared/types.ts';

export class BotWebsocket
{
	public wsConnections: Map<string, WebSocket> = new Map();

	/** Setup and send data to websocket connection.
	 *
	 * @param options
	 */
	public maybeSendWebsocketData( options: {
		type: string;
		user: SimpleUser;
		text?: string;
		count?: number;
		hasSound?: boolean | string;
		hasVideo?: boolean | string;
		hasImage?: boolean | string;
		showAvatar?: boolean;
		extra?: TwitchEventExtra;
		obs?: ObsData | ObsData[];
		saveEvent?: boolean;
	} )
	{
		const { type, user, text, count, extra, obs, hasSound, hasVideo, hasImage, showAvatar, saveEvent } = options;

		if ( !this.wsConnections || !user || !type ) return;

		const wsData: WebSocketData = {
			key: crypto.randomUUID(),
			type: type,
			user: user.displayName,
			userId: user.id || '',
			isSub: user.isSub || false,
			isMod: user.isMod || false,
			isVip: user.isVip || false,
			isFollower: user.isFollower || false,
			text: text || '',
			count: Number( count ) || 0,
			color: user.color || '#C7C7F1',
			profilePictureUrl: user.profilePictureUrl || '',
			hasSound: hasSound || false,
			hasVideo: hasVideo || false,
			hasImage: hasImage || false,
			showAvatar: showAvatar || false,
			extra: extra || null,
			obs: obs || null,
			saveEvent: saveEvent || false
		};

		try
		{
			for ( const [ wsId, ws ] of this.wsConnections.entries() )
			{
				if ( ws?.readyState !== WebSocket.OPEN )
				{
					ws.close();
					this.wsConnections.delete( wsId );
					continue;
				}

				try
				{
					ws.send( JSON.stringify( wsData ) );
				}
				catch ( error: unknown )
				{
					ws.close();
					this.wsConnections.delete( wsId );
					log( error );
				}
			}
			log( wsData.type );
		}
		catch ( error: unknown ) { log( error ) }
	}
}
