/**
 * Stream Credits
 * 
 * @author Wellington Estevo
 * @version 1.1.4
 */

import { useEffect, useState } from 'react';
import { useEvent } from '../EventContext.tsx';
import { log } from '@propz/helpers.ts';
import Window from './Window.tsx';

import type { WebSocketData } from '@propz/types.ts';
import Button from './Button.tsx';

const Credits = () =>
{
	const event = useEvent();
	const [events, setEvents] = useState({
		chatters: new Map(), // chat counter
		subbers: new Map(), // subs and resubs
		firstchatter: new Map(),
		followers: new Map(),
		raiders: new Map(),
		gifters: new Map() // all gifted subs
	});

	useEffect( () =>
	{
		if ( event )
		{
			if ( !event.detail ) return;
			processEvent( event.detail );
		}
	},
	[event]);

	/** Process incoming events.
	 * 
	 * @param {WebSocketData} eventDetails All event details
	 */
	const processEvent = ( eventDetails: WebSocketData ) =>
	{
		if ( !eventDetails?.type ) return;
		log( eventDetails.user + ' / ' + eventDetails.type );

		setEvents( prevEvents =>
		{
			const newEvents = { ...prevEvents };
			
			switch ( eventDetails.type )
			{
				case 'streamonline':
					return {
						chatters: new Map(), // chat counter
						subbers: new Map(), // subs and resubs
						firstchatter: new Map(),
						followers: new Map(),
						raiders: new Map(),
						gifters: new Map() // all gifted subs
					}

				case 'firstchatter':
					newEvents.firstchatter = new Map( prevEvents.firstchatter ).set( eventDetails.user,
					{
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'follow':
					newEvents.followers = new Map( prevEvents.followers ).set( eventDetails.user,
					{
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'message':
					newEvents.chatters = new Map( prevEvents.chatters ).set( eventDetails.user,
					{
						count: ( prevEvents.chatters.get( eventDetails.user )?.count ?? 0 ) + 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'raid':
					newEvents.raiders = new Map( prevEvents.raiders ).set( eventDetails.user,
					{
						count: ( prevEvents.raiders.get( eventDetails.user )?.count ?? 0 ) + 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'sub':
				case 'resub-1':
				case 'resub-2':
				case 'resub-3':
					newEvents.subbers = new Map( prevEvents.subbers ).set( eventDetails.user,
					{
						count: ( prevEvents.subbers.get( eventDetails.user )?.count || 0 ) + 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'subgift':
				case 'communitysub':
					newEvents.gifters = new Map( prevEvents.gifters ).set( eventDetails.user,
					{
						count: ( prevEvents.subbers.get( eventDetails.user )?.count ?? 0 ) + 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;
			}
			
			return newEvents;
		});
	}

	const getValues = ( name: string ) =>
	{
		const values = [];
		[...events[name]].sort( (a, b) => b[1].count - a[1].count ).forEach( ([user, value]) =>
		{
			values.push(
				<div className={ name + ' credits-entry' } key={ user }><img src={ value.profilePictureUrl } />
					<span className='user' style={{color: value.color}}>{ user }</span>
					{ value.count && <Button theme='dark'>{ value.count ?? '' }</Button> }
				</div>
			);
		});
		return values;
	}

	return(
		<marquee id="credits" direction="up" scrollamount="10">
			{ events.firstchatter.size > 0 &&
				<div id="firstchatter" className='credits-wrapper'>
					<Window>First-Chatter</Window>
					<Window theme="dark">{ getValues( 'firstchatter' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.subbers.size > 0 &&
				<div id="subbers" className='credits-wrapper'>
					<Window>Subbers</Window>
					<Window theme="dark">{ getValues( 'subbers' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.gifters.size > 0 &&
				<div id="gifters" className='credits-wrapper'>
					<Window>Gifters</Window>
					<Window theme="dark">{ getValues( 'gifters' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.followers.size > 0 &&
				<div id="followers" className='credits-wrapper'>
					<Window>Followers</Window>
					<Window theme="dark">{ getValues( 'followers' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.raiders.size > 0 &&
				<div id="raiders" className='credits-wrapper'>
					<Window>Raiders</Window>
					<Window theme="dark">{ getValues( 'raiders' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.chatters.size > 0 &&
				<div id="chatters" className='credits-wrapper'>
					<Window>Chatters</Window>
					<Window theme="dark">{ getValues( 'chatters' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
		</marquee>
	);
}

export default Credits;