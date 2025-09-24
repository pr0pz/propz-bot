/**
 * Single Chat message
 *
 * @author Wellington Estevo
 * @version 1.8.2
 */

import parse from 'html-react-parser';
import { useEvent } from '../EventContext.tsx';
import { useEffect, useState } from 'react';

const ChatMessage = ( propz: { message: string; user: string; color?: string; key: string, isSub: boolean, styles: string } ) =>
{
	const event = useEvent();
	const [chatMessage, setMessage] = useState<string>( propz.message );
	const [chatUser, setUser] = useState<string>( propz.user );

	useEffect( () =>
	{
		if ( event?.detail?.text !== 'clear' ) return;
		setMessage( '*** STREAM HYGIENE ***' );
		setUser( '*** STREAM HYGIENE ***' );
	},
	[event]);

	return (
		<>
			<li className={ propz.user.toLowerCase() } style={{ background: '0 !important' }}>
				{ propz.isSub && propz.styles && <style>{ `.${propz.user.toLowerCase()}{${propz.styles}}` }</style> }
				<div className='chat-message-wrapper browser radius border shadow'>
					<div className='chat-user browser-header' style={{ color:propz.color }}>
						{ chatUser }:
					</div>
					<div className='chat-message browser-body'>{
						parse( chatMessage.replaceAll( '\\', '' ) )
					}</div>
				</div>
			</li>
		</>
	);
}

export default ChatMessage;
