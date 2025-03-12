/**
 * Websocket Handler
 * 
 * @author Wellington Estevo
 * @version 1.5.11
 */

import '@propz/prototypes.ts';
import { log } from '@propz/helpers.ts';
import type { ObsData, SimpleUser, TwitchEventExtra, WebSocketData } from '@propz/types.ts';

export class BotWebsocket
{
	public wsConnections: Map<string,WebSocket> = new Map();

	/** Setup and send data to websocket connection.
	 * 
	 * @param {string} type Event type
	 * @param {SimpleUser} user User
	 * @param {string} text Message text (only for message events)
	 * @param {number} count Event count
	 * @param {TwitchEventExtra} extra Whatever extra data
	 * @param {ObsData|ObsData[]} obs Data to send to obs
	 */
	public maybeSendWebsocketData( options: {
		type: string,
		user: SimpleUser,
		text?: string,
		count?: number,
		hasSound?: boolean|string,
		hasVideo?: boolean|string,
		showAvatar?: boolean,
		extra?: TwitchEventExtra,
		obs?: ObsData|ObsData[],
		saveEvent?: boolean
	})
	{
		const { type, user, text, count, extra, obs, hasSound, hasVideo, showAvatar, saveEvent } = options;

		if ( !this.wsConnections || !user || !type ) return;
		
		const wsData: WebSocketData = {
			key: crypto.randomUUID(),
			type: type,
			user: user.displayName!,
			text: text || '',
			count: Number( count ) || 0,
			color: user.color || '#C7C7F1',
			profilePictureUrl: user.profilePictureUrl || '',
			hasSound: hasSound || false,
			hasVideo: hasVideo || false,
			showAvatar: showAvatar || false,
			extra: extra || null,
			obs: obs || null,
			saveEvent: saveEvent || false
		};

		try
		{
			for ( const ws of this.wsConnections.values() )
			{
				if ( !ws?.readyState || ws.readyState !== WebSocket.OPEN ) return;
				ws.send( JSON.stringify( wsData ) );
			}
			log( wsData.type )
		}
		catch ( error: unknown ) { log( error ); }
	}
}