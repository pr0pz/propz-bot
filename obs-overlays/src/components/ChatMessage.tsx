/**
 * Single Chat message with Shadow DOM isolation
 *
 * @author Wellington Estevo
 * @version 1.8.8
 */

import parse from 'html-react-parser';
import { useEvent } from '../EventContext.tsx';
import { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Base CSS from ChatMessage.css
const baseChatMessageCSS = `
*,*:after,*:before {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

.chat-message-wrapper {
	position: relative;
    margin-bottom: 1.5rem;
    
    opacity: .9;
    background: var(--color-primary);
    box-shadow: .5rem .5rem 0 var(--color-dark);
    border: var(--border-size) solid var(--color-dark);
    border-radius: var(--border-radius);
    
    color: #fff;
    font-family: var(--font-family-chat);
    line-height: 1.2;

    animation: slideInUp 30s ease-in-out;
}

.chat-user {
	position: relative;
    background: var(--color-primary);
    padding: 1rem 2rem;

    font-family: var(--font-family-headline);
    color: #aaa;
    font-weight: 900;
    line-height: 1;
    
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

.chat-user-avatar {
	border-radius: 100%;
	width: 6rem;
	position: absolute;
	right: 2rem;
	top: -1rem;
	z-index: 1;
}

.chat-message {
    position:relative;
    background: var(--color-secondary);
    padding: 2rem;
    word-break: break-word;
    
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
}

.chat-message .emote {
    max-width: 3rem;
}

.chat-message img {
    max-width: 100%;
}

@keyframes slideInUp {
    0% {
        opacity: 0;
        transform: translateY(5rem);
    }
    5% {
        opacity: 1;
        transform: translateY(0);
    }
    95% {
        opacity: 1;
        transform: translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateY(-1rem);
    }
}
`;

const ShadowChatMessage = ( propz: {
	message: string;
	user: string;
	color?: string;
	userStyles?: string;
	profilePictureUrl: string
} ) =>
{
	const event = useEvent() as CustomEvent;
	const [chatMessage, setMessage] = useState<string>( propz.message );
	const [chatUser, setUser] = useState<string>( propz.user );

	useEffect( () =>
	{
		if ( (event as { detail?: { text?: string } })?.detail?.text !== 'clear' ) return;
		setMessage( '*** STREAM HYGIENE ***' );
		setUser( '*** STREAM HYGIENE ***' );
	},
	[event]);

	return (
		<div className='chat-message-wrapper'>
			<div className='chat-user' style={{ color: propz.color }}>
				<div className='chat-user-name'>{ chatUser }</div>
				{ propz.profilePictureUrl && <img src={ propz.profilePictureUrl } alt={ chatUser } className='chat-user-avatar' /> }
			</div>
			<div className='chat-message'>
				{ parse( chatMessage.replaceAll( '\\', '' ) ) }
			</div>
		</div>
	);
};

const ChatMessage = ( propz: {
	message: string;
	user: string;
	color?: string;
	key: string,
	isSub: boolean,
	styles: string,
	profilePictureUrl: string
} ) =>
{
	const shadowRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		if (!shadowRef.current) return;

		const shadow = shadowRef.current.attachShadow({ mode: 'open' });

		// Create style element with base styles + user styles
		const style = document.createElement('style');
		style.textContent = `
			${baseChatMessageCSS}

			/* User Custom Styles */
			${propz.isSub && propz.styles ? propz.styles : ''}
		`;
		shadow.appendChild(style);

		// Create container for React content
		const container = document.createElement('div');
		shadow.appendChild(container);

		// Render React component inside shadow DOM
		const root = createRoot(container);
		root.render(
			<ShadowChatMessage
				message={propz.message}
				user={propz.user}
				color={propz.color}
				userStyles={propz.styles}
				profilePictureUrl={propz.profilePictureUrl}
			/>
		);

		// Cleanup function
		return () => {
			root.unmount();
		};
	}, [propz.message, propz.user, propz.color, propz.styles, propz.isSub]);

	return <div ref={shadowRef} className={propz.user.toLowerCase()} style={{ background: '0 !important' }}></div>;
}

export default ChatMessage;
