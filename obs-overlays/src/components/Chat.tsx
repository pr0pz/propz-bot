/**
 * Chat Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.2
 */

import { useEffect, useState } from "react";
import { useEvent } from '../EventContext.tsx';
import ChatMessage from "./ChatMessage.tsx";

const Chat = () =>
{	
	const event = useEvent();
	const initialChatMessage = <ChatMessage message="Chat ist ready to rumble" user="PropzMaster" key="1" />;
	const [chatMessages, setChatMessages] = useState([ initialChatMessage ]);

	useEffect( () =>
	{
		if (
			!event ||
			!event?.detail?.type ||
			event.detail.type !== 'message'
		) return;

		processMessage( event.detail );
	},
	[event]) // eslint-disable-line react-hooks/exhaustive-deps
	
	/**
	 * Process chat message
	 * 
	 * @param {Object} messageData 
	 */
	const processMessage = ( messageData ) =>
	{
		// Only do something if chat message (and not command)
		if ( !messageData?.type === 'message' ) return;

		const newMessage = <ChatMessage message={ messageData.text } user={ messageData.user } color={ messageData.color } key={ crypto.randomUUID() } />;
		setChatMessages( ( prevMessages ) => [ ...prevMessages, newMessage ] );

		// Schedule the removal of the message after 30 seconds
		setTimeout(() =>
		{
			setChatMessages( (prevMessages) => prevMessages.slice(1) );
		}, 30000 );
	}

	return (
		<ul className="chat-messages radius">
			{chatMessages.map( (message, index) => ( message ))}
		</ul>
	);
}

export default Chat;
