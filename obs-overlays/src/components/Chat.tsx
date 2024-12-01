/**
 * Chat Manager
 * 
 * @author Wellington Estevo
 * @version 1.0.4
 */

import { useEffect, useState } from "react";
import { useEvent } from '../EventContext.tsx';
import ChatMessage from "./ChatMessage.tsx";
import type { WebSocketData } from '../../../shared/types.ts';

const Chat = () =>
{	
	const event = useEvent();
	const initialChatMessage = <ChatMessage message="Chat ist ready to rumble" user="Propz_tv" key="1" />;
	const [chatMessages, setChatMessages] = useState<typeof ChatMessage[]>([ initialChatMessage ]);

	useEffect( () =>
	{
		if ( event?.detail?.type !== 'message' ) return;
		processMessage( event.detail );
	},
	[event]);
	
	/** Process chat message
	 * 
	 * @param {WebSocketData} messageData 
	 */
	const processMessage = ( messageData: WebSocketData ) =>
	{
		const newMessage = <ChatMessage message={ messageData.text } user={ messageData.user } color={ messageData.color } key={ messageData.key } />;
		setChatMessages( ( prevMessages: typeof ChatMessage[] ) => [ ...prevMessages, newMessage ] );

		// Schedule the removal of the message after 30 seconds
		setTimeout(() =>
		{
			setChatMessages( ( prevMessages: typeof ChatMessage[] ) => prevMessages.slice(1) );
		}, 30000 );
	}

	return (
		<ul className="chat-messages radius">
			{chatMessages.map( (message, _index) => ( message ))}
		</ul>
	);
}

export default Chat;
