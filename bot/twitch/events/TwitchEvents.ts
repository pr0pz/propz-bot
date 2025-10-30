/**
 * Twitch Event Controller
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { clearTimer, getRewardSlug, log, sleep } from '@shared/helpers.ts';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { EventProcessor } from "./EventProcessor.ts";
import { UserData } from '@services/UserData.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { EventSubChannelAdBreakBeginEvent, EventSubChannelFollowEvent, EventSubChannelRaidEvent, EventSubChannelRedemptionAddEvent, EventSubChannelShieldModeBeginEvent, EventSubChannelShieldModeEndEvent, EventSubChannelUpdateEvent, EventSubStreamOfflineEvent, EventSubStreamOnlineEvent } from '@twurple/eventsub-base';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class TwitchEvents
{
	public listener: EventSubWsListener;
	public eventProcessor: EventProcessor;
	private listenerTimer: number = 0;

	constructor( private twitch: Twitch )
	{
		this.eventProcessor = new EventProcessor( this.twitch );
		this.listener = new EventSubWsListener( { apiClient: this.twitch.twitchApi } );
		this.handleEvents();
	}

	/** Add event handler fucntions to events */
	private handleEvents(): void
	{
		this.listener.onStreamOnline(  UserHelper.broadcasterId, this.onStreamOnline );
		this.listener.onStreamOffline(  UserHelper.broadcasterId, this.onStreamOffline );
		this.listener.onChannelFollow(  UserHelper.broadcasterId,  UserHelper.broadcasterId, this.onChannelFollow );
		this.listener.onChannelRedemptionAdd(  UserHelper.broadcasterId, this.onChannelRedemptionAdd );
		this.listener.onChannelUpdate(  UserHelper.broadcasterId, this.onChannelUpdate );
		this.listener.onChannelAdBreakBegin(  UserHelper.broadcasterId, this.onChannelAdBreakBegin );
		this.listener.onChannelShieldModeBegin(  UserHelper.broadcasterId,  UserHelper.broadcasterId,
			this.onChannelShieldModeBegin );
		this.listener.onChannelShieldModeEnd(  UserHelper.broadcasterId,  UserHelper.broadcasterId,
			this.onChannelShieldModeEnd );
		this.listener.onChannelRaidFrom(  UserHelper.broadcasterId, this.onChannelRaidFrom );
		this.listener.onChannelRaidTo(  UserHelper.broadcasterId, this.onChannelRaidTo );
	}

	/** Start listener */
	public startListener(): void
	{
		this.listenerTimer = clearTimer( this.listenerTimer );
		if ( !this.listener ) return;
		try
		{
			this.listener.start();
			log( `Listening to events` );
		}
		catch ( error: unknown )
		{
			log( error );
			this.listenerTimer = setTimeout( () => this.startListener(), 5000 );
		}
	}

	/** Subscribes to events representing a stream going live.
	 *
	 * @param {EventSubStreamOnlineEvent} event An EventSub event representing a stream going live.
	 */
	public onStreamOnline = async ( event: EventSubStreamOnlineEvent ) =>
	{
		if ( !event ) return;

		// Try to get the stream 5 times
		let stream = null;
		let counter = 0;
		while ( counter < 5 )
		{
			stream = await this.twitch.stream.set();
			if ( stream !== null ) break;
			await sleep( 250 );
			counter++;
		}

		if ( stream === null && counter === 5 )
			log( new Error( `Couldn't get Stream data on Stream start` ) );

		log( `${event.broadcasterDisplayName} / ${stream?.gameName} / ${counter}` );

		// Check for test stream
		if ( stream?.gameName && stream?.gameName?.toLowerCase().includes( 'test' ) ) return;

		void this.eventProcessor.process( {
			eventType: 'streamonline',
			user: event.broadcasterName
		} );

		void this.twitch.focus.handle( 7 );

		void this.twitch.stream.sendStreamOnlineDataToDiscord( stream );
	};

	/** Subscribes to events representing a stream going offline.
	 *
	 * @param {EventSubStreamOfflineEvent} event An EventSub event representing a stream going offline.
	 */
	public onStreamOffline = ( event: EventSubStreamOfflineEvent ) =>
	{
		if ( !event ) return;
		void this.twitch.stream.set( null );

		void this.eventProcessor.process( {
			eventType: 'streamoffline',
			user: event.broadcasterName
		} );
	};

	/** Subscribes to events that represent a user following a channel.
	 *
	 * @param {EventSubChannelFollowEvent} event An EventSub event representing a channel being followed.
	 */
	public onChannelFollow = ( event: EventSubChannelFollowEvent ) =>
	{
		if ( !event ) return;

		// Don't do anything if user has already followed
		if ( UserData.get( event.userId )?.follow_date ) return;

		void this.eventProcessor.process( {
			eventType: 'follow',
			user: event.userDisplayName
		} );
	};

	/** Subscribes to events that represents a Channel Points reward being redeemed.
	 *
	 * @param {EventSubChannelRedemptionAddEvent} event An EventSub event representing a Channel Points redemption.
	 */
	public onChannelRedemptionAdd = ( event: EventSubChannelRedemptionAddEvent ) =>
	{
		if ( !event ) return;
		const eventType = getRewardSlug( event.rewardTitle );
		let eventText = event.input;

		log( eventType );

		// TTS size
		if ( eventType === 'rewardtts' && eventText )
			eventText = eventText.substring( 0, 161 );

		void this.eventProcessor.process( {
			eventType: eventType,
			user: event.userDisplayName,
			eventText: eventText
		} );
	};

	/** Subscribes to events representing a change in channel metadata, e.g. stream title or category.
	 *
	 * @param {EventSubChannelUpdateEvent} _event The function that will be called for any new notifications.
	 */
	public onChannelUpdate = ( _event: EventSubChannelUpdateEvent ) =>
	{
		log( 'channelupdate' );
		void this.twitch.stream.set();
	};

	/** Subscribes to events that represent an ad break beginning.
	 *
	 * @param {EventSubChannelAdBreakBeginEvent} event The function that will be called for any new notifications.
	 */
	public onChannelAdBreakBegin = ( event: EventSubChannelAdBreakBeginEvent ) =>
	{
		if ( !event ) return;
		const durationSeconds = event.durationSeconds || 180;
		log( durationSeconds );

		void this.eventProcessor.process( {
			eventType: 'adbreak',
			user: event.broadcasterDisplayName,
			eventCount: durationSeconds
		} );
	};

	/** Subscribes to events that represent a broadcaster being raided by another broadcaster.
	 *
	 * @param {EventSubChannelRaidEvent} event The function that will be called for any new notifications.
	 */
	public onChannelRaidFrom = ( event: EventSubChannelRaidEvent ) =>
	{
		log( `Raided: ${event.raidedBroadcasterName} / Raiding: ${event.raidingBroadcasterName}` );
	};

	/** Subscribes to events that represent a broadcaster raiding another broadcaster.
	 *
	 * @param {EventSubChannelRaidEvent} event The function that will be called for any new notifications.
	 */
	public onChannelRaidTo = ( event: EventSubChannelRaidEvent ) =>
	{
		log( `Raided: ${event.raidedBroadcasterName} / Raiding: ${event.raidingBroadcasterName}` );
	};

	/** Subscribes to events that represent Shield Mode being activated in a channel.
	 *
	 * @param {EventSubChannelShieldModeBeginEvent} event The function that will be called for any new notifications.
	 */
	public onChannelShieldModeBegin = ( event: EventSubChannelShieldModeBeginEvent ) =>
	{
		if ( !event ) return;
		log( 'shield active' );
		this.twitch.killswitch.set( true );

		void this.eventProcessor.process( {
			eventType: 'shieldmodebegin',
			user: event.broadcasterDisplayName
		} );
	};

	/** Subscribes to events that represent Shield Mode being deactivated in a channel.
	 *
	 * @param {EventSubChannelShieldModeEndEvent} event The function that will be called for any new notifications.
	 */
	public onChannelShieldModeEnd = ( event: EventSubChannelShieldModeEndEvent ) =>
	{
		if ( !event ) return;
		log( 'shield inactive' );
		this.twitch.killswitch.set( false );

		void this.eventProcessor.process( {
			eventType: 'shieldmodeend',
			user: event.broadcasterDisplayName
		} );
	};
}
