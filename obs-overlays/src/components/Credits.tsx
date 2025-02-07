/**
 * Stream Credits
 * 
 * @author Wellington Estevo
 * @version 1.2.8
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
		message: new Map(), // chat counter
		cheer: new Map(), // bits
		sub: new Map(), // subs and resubs
		firstchatter: new Map(),
		follow: new Map(),
		raid: new Map(),
		subgift: new Map() // all gifted subs
	});

	useEffect( () => setInititalCredits() ,[] );
	useEffect( () =>
	{
		if ( event?.detail )
			processEvent( event.detail );
	},
	[event]);

	const setInititalCredits = async () =>
	{
		const fetchOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: '{ "request": "getCredits" }'
		};

		try {
			let urlPrefix = 'https';
			if ( process.env.BOT_URL.includes( 'localhost' ) || process.env.BOT_URL.includes( '127.0.0.1' ) )
				urlPrefix = 'http';

			console.log( `${urlPrefix}://${ process.env.BOT_URL }/api` );
			console.log( fetchOptions );
			
			const response = await fetch( `${urlPrefix}://${ process.env.BOT_URL }/api`, fetchOptions );
			const data = await response.json();
	
			for( const creditCat of Object.keys( data.data ) )
			{
				for ( const userName of Object.keys( data.data[ creditCat ] ) )
				{
					const eventDetails: WebSocketData = {
						'key': crypto.randomUUID(),
						'type': creditCat,
						'user': userName,
						'text': '',
						'count': data.data[ creditCat ][ userName ].count || 0,
						'color': data.data[ creditCat ][ userName ].color
					}
					processEvent( eventDetails );
				}
			}
		}
		catch ( error: unknown ) { log( error ) }
	}

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
				case 'firstchatter':
					if ( prevEvents.firstchatter ) break;
					newEvents.firstchatter = new Map( prevEvents.firstchatter ).set( eventDetails.user,
					{
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'follow':
					newEvents.follow = new Map( prevEvents.follow ).set( eventDetails.user,
					{
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'message':
					newEvents.message = new Map( prevEvents.message ).set( eventDetails.user,
					{
						count: ( prevEvents.message.get( eventDetails.user )?.count ?? 0 ) + 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'cheer':
					newEvents.cheer = new Map( prevEvents.cheer ).set( eventDetails.user,
					{
						count: ( prevEvents.cheer.get( eventDetails.user )?.count ?? 0 ) + ( eventDetails?.count || 1 ),
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;
			
				case 'raid':
					newEvents.raid = new Map( prevEvents.raid ).set( eventDetails.user,
					{
						count: eventDetails?.count || 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'sub':
				case 'resub-1':
				case 'resub-2':
				case 'resub-3':
					newEvents.sub = new Map( prevEvents.sub ).set( eventDetails.user,
					{
						count: ( prevEvents.sub.get( eventDetails.user )?.count || 0 ) + 1,
						profilePictureUrl: eventDetails.profilePictureUrl,
						color: eventDetails.color
					});
					break;

				case 'subgift':
				case 'communitysub':
					newEvents.subgift = new Map( prevEvents.subgift ).set( eventDetails.user,
					{
						count: ( prevEvents.sub.get( eventDetails.user )?.count ?? 0 ) + 1,
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
			{ events.sub.size > 0 &&
				<div id="subbers" className='credits-wrapper'>
					<Window>Subbers</Window>
					<Window theme="dark">{ getValues( 'sub' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.subgift.size > 0 &&
				<div id="gifters" className='credits-wrapper'>
					<Window>Gifters</Window>
					<Window theme="dark">{ getValues( 'subgift' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.cheer.size > 0 &&
				<div id="cheers" className='credits-wrapper'>
					<Window>Bits baby</Window>
					<Window theme="dark">{ getValues( 'cheer' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.follow.size > 0 &&
				<div id="followers" className='credits-wrapper'>
					<Window>Followers</Window>
					<Window theme="dark">{ getValues( 'follow' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.raid.size > 0 &&
				<div id="raiders" className='credits-wrapper'>
					<Window>Raiders</Window>
					<Window theme="dark">{ getValues( 'raid' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
			{ events.message.size > 0 &&
				<div id="chatters" className='credits-wrapper'>
					<Window>Chatters</Window>
					<Window theme="dark">{ getValues( 'message' ).map( (value) => ( value ) ) }</Window>
				</div>
			}
		</marquee>
	);
}

export default Credits;