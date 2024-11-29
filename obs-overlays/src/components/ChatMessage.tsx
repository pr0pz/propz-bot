/**
 * Single Chat message
 * 
 * @author Wellington Estevo
 * @version 1.0.2
 */

import parse from 'html-react-parser';
import { useEvent } from '../EventContext.tsx';
import { useEffect, useState } from 'react';

const ChatMessage = ( propz ) =>
{
	const event = useEvent();
	const [chatMessage, setMessage] = useState( propz.message );
	const [chatUser, setUser] = useState( propz.user );

	useEffect( () =>
	{
		if (
			!event ||
			!event?.detail?.text ||
			event.detail.text !== '!clear'
		) return;

		setMessage( '*** STREAM HYGIENE ***' );
		setUser( '*** STREAM HYGIENE ***' );
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps
	
	return (
		<li className='chat-message-wrapper browser radius border shadow'>
			<div className='chat-user browser-header' style={{ color:propz.color }}>
				{ chatUser }:
			</div>
			<div className='chat-message browser-body'>{ parse( chatMessage ) }</div>
		</li>
	)
}

export default ChatMessage;