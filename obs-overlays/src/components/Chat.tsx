/**
 * Chat Manager
 *
 * @author Wellington Estevo
 * @version 1.8.2
 */

import { log } from '@propz/helpers.ts';
import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import ChatMessage from "./ChatMessage.tsx";
import type { WebSocketData, UserChatStyles } from '@propz/types.ts';

interface ChatMessageData {
	message: string;
	user: string;
	color?: string;
	isSub: boolean;
	styles: string;
	key: string;
}

const Chat = () =>
{
	const event = useEvent();
	const initialMessage: ChatMessageData = { message: "Chat ist ready to rumble", user: "Propz_tv", key: "1" };
	const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([initialMessage]);
	const [chatStyles, setChatStyles] = useState<Map<string, string>>(new Map());

	useEffect( ()=>
	{
		const getStyles = async () => {
			const response = await fetch( 'https://dev.propz.de/wp-json/tdp/all-styles' );
			if ( !response.ok ) return;

			const result = await response.json();
			if ( !result ) return;

			const users = JSON.parse( result );

			const stylesMap = new Map<string, string>();
			users.forEach( ( user: UserChatStyles ) => {
				stylesMap.set( user.twitch_user_id, user.chat_styles );
			} );
			setChatStyles(stylesMap);
		}

		void getStyles();
	},
	[]);

	useEffect( () =>
	{
		if ( !event || typeof event !== 'object' || !('detail' in event) || !event.detail ) return;
		const detail = event.detail as any;
		if ( detail.type !== 'message' ) return;
		processMessage( detail );
	},
	[event]);

	/** Process chat message
	 *
	 * @param {WebSocketData} messageData
	 */
	const processMessage = ( messageData: WebSocketData ) =>
	{
		const messageStyle = chatStyles.get( messageData.userId );
		const newMessageData: ChatMessageData = {
			message: messageData.text,
			user: messageData.user,
			color: messageData.color,
			isSub: messageData.isSub,
			styles: messageStyle ?? '',
			key: messageData.key
		};

		console.log( newMessageData );

		setChatMessages( ( prevMessages: ChatMessageData[] ) => [ ...prevMessages, newMessageData ] );
		playChatSound();

		// Schedule the removal of the message after 30 seconds
		setTimeout(() =>
		{
			setChatMessages( ( prevMessages: ChatMessageData[] ) => prevMessages.slice(1) );
		}, 30000 );
	}

	const playChatSound = () =>
	{
		const audio = document.getElementById( 'chatsound' ) as HTMLAudioElement;
		if ( !audio ) return;
		audio.volume = 1;
		audio.play().catch( ( error: unknown ) => log( error ) );
	}

	return (
		<>
			<ul className="chat-messages radius">
				{chatMessages.map( (messageData) => (
					<ChatMessage
						key={messageData.key}
						message={messageData.message}
						user={messageData.user}
						color={messageData.color}
						isSub={messageData.isSub}
						styles={messageData.styles}
					/>
				))}
			</ul>
		</>
	);
}

export default Chat;
