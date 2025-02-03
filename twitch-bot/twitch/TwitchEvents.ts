/**
 * Twitch Event Controller
 * 
 * @author Wellington Estevo
 * @version 1.2.4
 */

import { EventSubWsListener } from '@twurple/eventsub-ws';
import { getRewardSlug, log } from '@propz/helpers.ts';

import type {
	EventSubChannelAdBreakBeginEvent,
	EventSubChannelFollowEvent,
	EventSubChannelRaidEvent,
	EventSubChannelRedemptionAddEvent,
	EventSubChannelShieldModeBeginEvent,
	EventSubChannelShieldModeEndEvent,
	EventSubChannelUpdateEvent,
	EventSubStreamOfflineEvent,
	EventSubStreamOnlineEvent,
} from '@twurple/eventsub-base';
import type { SimpleUser } from '@propz/types.ts';
import type { TwitchUtils } from './TwitchUtils.ts';

export class TwitchEvents
{
	private twitch: TwitchUtils;
	public listener: EventSubWsListener;

	constructor( twitch: TwitchUtils )
	{
		this.twitch = twitch;
		this.listener = new EventSubWsListener({ apiClient: this.twitch.data.twitchApi });
		this.handleEvents();
	}

	/** Add event handler fucntions to events */
	handleEvents()
	{
		this.listener.onStreamOnline( this.twitch.data.userId, this.onStreamOnline );
		this.listener.onStreamOffline( this.twitch.data.userId, this.onStreamOffline );
		this.listener.onChannelFollow( this.twitch.data.userId, this.twitch.data.userId, this.onChannelFollow );
		this.listener.onChannelRedemptionAdd( this.twitch.data.userId, this.onChannelRedemptionAdd );
		this.listener.onChannelUpdate( this.twitch.data.userId, this.onChannelUpdate );
		this.listener.onChannelAdBreakBegin( this.twitch.data.userId, this.onChannelAdBreakBegin );
		this.listener.onChannelShieldModeBegin( this.twitch.data.userId, this.twitch.data.userId, this.onChannelShieldModeBegin );
		this.listener.onChannelShieldModeEnd( this.twitch.data.userId, this.twitch.data.userId, this.onChannelShieldModeEnd );
		this.listener.onChannelRaidFrom( this.twitch.data.userId, this.onChannelRaidFrom );
		this.listener.onChannelRaidTo( this.twitch.data.userId, this.onChannelRaidTo );
	}

	/** Start listener */
	startListener()
	{
		if ( !this.listener ) return;
		try
		{
			this.listener.start();
			log( `Listening to events` );
		}
		catch ( error: unknown )
		{
			log( error );
			setTimeout( () => this.startListener(), 5000 );
		}
	}

	/** Subscribes to events representing a stream going live.
	 * 
	 * @param {EventSubStreamOnlineEvent} event An EventSub event representing a stream going live.
	 */
	onStreamOnline = ( event: EventSubStreamOnlineEvent ) =>
	{
		if ( !event ) return;
		log( event.broadcasterDisplayName );
		this.twitch.setStreamFirstChatter( '' );

		this.twitch.processEvent({
			eventType: 'streamonline',
			user: event.broadcasterName
		});

		setTimeout( async () =>
		{
			const stream = await this.twitch.setStream();
			if ( stream?.gameName && stream.gameName.toLowerCase().includes( 'test' ) ) return;
			this.twitch.sendStremOnlineDataToDiscord( stream );
		}, 10000 );
	}

	/** Subscribes to events representing a stream going offline.
	 * 
	 * @param {EventSubStreamOfflineEvent} event An EventSub event representing a stream going offline.
	 */
	onStreamOffline = ( event: EventSubStreamOfflineEvent ) =>
	{
		if ( !event ) return;
		this.twitch.setStream( null );
		this.twitch.setStreamFirstChatter( this.twitch.data.userName );

		this.twitch.processEvent({
			eventType: 'streamoffline',
			user: event.broadcasterName
		});
	}

	/** Subscribes to events that represent a user following a channel.
	 * 
	 * @param {EventSubChannelFollowEvent} event An EventSub event representing a channel being followed.
	 */
	onChannelFollow = ( event: EventSubChannelFollowEvent ) =>
	{
		if ( !event ) return;
		if ( this.twitch.data.isBot( event.userName ) ) return;

		// Don't do anything if user has already followed
		if ( this.twitch.data.getUsersData( event.userId ).follow ) return;

		this.twitch.processEvent({
			eventType: 'follow',
			user: event.userDisplayName
		});

		// Update persistent user data
		const user: SimpleUser = {
			id: event.userId,
			name: event.userName,
			displayName: event.userDisplayName
		}
		const followDateTimestamp = Math.floor( event.followDate.getTime() / 1000 );
		this.twitch.data.updateUserData( user, 'follow', followDateTimestamp );
	}

	/** Subscribes to events that represents a Channel Points reward being redeemed.
	 * 
	 * @param {EventSubChannelRedemptionAddEvent} event An EventSub event representing a Channel Points redemption.
	 */
	onChannelRedemptionAdd = ( event: EventSubChannelRedemptionAddEvent ) =>
	{
		if ( !event ) return;
		const eventType = getRewardSlug( event.rewardTitle );
		let eventText = event.input;

		log( eventType );

		// TTS size
		if ( eventType === 'rewardtts' && eventText )
			eventText = eventText.substring(0, 161);

		this.twitch.processEvent({
			eventType: eventType,
			user: event.userDisplayName,
			eventText: eventText
		});
	}

	/** Subscribes to events representing a change in channel metadata, e.g. stream title or category.
	 * 
	 * @param {EventSubChannelUpdateEvent} _event The function that will be called for any new notifications.
	 */
	onChannelUpdate = ( _event: EventSubChannelUpdateEvent ) =>
	{
		log( 'channelupdate' );
		this.twitch.setStream();
	}

	/** Subscribes to events that represent an ad break beginning.
	 * 
	 * @param {EventSubChannelAdBreakBeginEvent} event The function that will be called for any new notifications.
	 */
	onChannelAdBreakBegin = ( event: EventSubChannelAdBreakBeginEvent ) =>
	{
		if ( !event ) return;
		const durationSeconds = event.durationSeconds || 180;
		log( durationSeconds );

		this.twitch.processEvent({
			eventType: 'adbreak',
			user: event.broadcasterDisplayName,
			eventCount: durationSeconds
		});
	}

	/** Subscribes to events that represent a broadcaster being raided by another broadcaster.
	 * 
	 * @param {EventSubChannelRaidEvent} event The function that will be called for any new notifications.
	*/
	onChannelRaidFrom = ( event: EventSubChannelRaidEvent ) =>
	{
		log( `Raided: ${event.raidedBroadcasterName} / Raiding: ${event.raidingBroadcasterName}` );
	}

	/** Subscribes to events that represent a broadcaster raiding another broadcaster.
	 * 
	 * @param {EventSubChannelRaidEvent} event The function that will be called for any new notifications.
	*/
	onChannelRaidTo = ( event: EventSubChannelRaidEvent ) =>
	{
		log( `Raided: ${event.raidedBroadcasterName} / Raiding: ${event.raidingBroadcasterName}` );
	}

	/** Subscribes to events that represent Shield Mode being activated in a channel.
	 * 
	 * @param {EventSubChannelShieldModeBeginEvent} event The function that will be called for any new notifications.
	 */
	onChannelShieldModeBegin = ( event: EventSubChannelShieldModeBeginEvent ) =>
	{
		if ( !event ) return;
		log( 'shield active' );
		this.twitch.toggleKillswitch( true );

		this.twitch.processEvent({
			eventType: 'shieldmodebegin',
			user: event.broadcasterDisplayName
		});
	}

	/** Subscribes to events that represent Shield Mode being deactivated in a channel.
	 * 
	 * @param {EventSubChannelShieldModeEndEvent} event The function that will be called for any new notifications.
	 */
	onChannelShieldModeEnd = ( event: EventSubChannelShieldModeEndEvent ) =>
	{
		if ( !event ) return;
		log( 'shield inactive' );
		this.twitch.toggleKillswitch( false );

		this.twitch.processEvent({
			eventType: 'shieldmodeend',
			user: event.broadcasterDisplayName
		});
	}
}