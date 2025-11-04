/**
 * Chat Manager
 *
 * @author Wellington Estevo
 * @version 2.0.2
 */

import { log } from '@shared/helpers.ts';
import { useEffect, useState } from 'react';
import { useEvent } from '@frontend/EventContext.tsx';
import ChatMessage from '@components/ChatMessage.tsx';
import type { WebSocketData, UserChatStyles } from '@shared/types.ts';

interface ChatMessageData {
	message: string;
	user: string;
	color?: string;
	isSub: boolean;
	styles: string;
	key: string;
	profilePictureUrl?: string;
}

const Chat = () =>
{
	const event = useEvent();
	const initialMessage: ChatMessageData = { message: "Chat ist ready to rumble", user: "Propz_tv", key: "1", isSub: false, styles: '' };
	const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([initialMessage]);
	const [chatStyles, setChatStyles] = useState<Map<string, string>>(new Map());

	useEffect( ()=>
	{
		void getStyles();
	},
	[]);

	useEffect( () =>
	{
		if ( !event || typeof event !== 'object' || !('detail' in event) || !event.detail ) return;
		const detail = event.detail as any;

		// Reload CSS
		if ( detail.type === 'command' && detail.text === 'reloadcss' )
		{
			void getStyles();
			return;
		}

		if ( detail.type !== 'message' ) return;
		processMessage( detail );
	},
	[event]);

	/**
	 * Get styles from wordpress
	 *
	 * @returns {Promise<void>}
	 */
	const getStyles = async (): Promise<void> => {
		const response = await fetch( 'https://propz.de/wp-json/tdp/all-styles',
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'propz-bot'
				}
			} );
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

	/** Process chat message
	 *
	 * @param {WebSocketData} messageData
	 */
	const processMessage = ( messageData: WebSocketData ) =>
	{
		let profilePictureUrl = '';
		if (
			messageData.isFollower ||
			messageData.isVip ||
			messageData.isMod ||
			messageData.isSub
		)
		{
			profilePictureUrl = messageData.profilePictureUrl ?? '';
		}

		const messageStyle = chatStyles.get( messageData.userId );
		const newMessageData: ChatMessageData = {
			message: messageData.text,
			user: messageData.user,
			color: messageData.color,
			isSub: messageData.isSub,
			styles: messageStyle ?? '',
			key: messageData.key,
			profilePictureUrl: profilePictureUrl
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
			<div className="chat-messages">
				{chatMessages.map( (messageData) => (
					<ChatMessage
						key={messageData.key}
						message={messageData.message}
						user={messageData.user}
						color={messageData.color}
						isSub={messageData.isSub}
						styles={messageData.styles}
						profilePictureUrl={messageData.profilePictureUrl ?? ''}
					/>
				))}
			</div>
		</>
	);
}

export default Chat;
