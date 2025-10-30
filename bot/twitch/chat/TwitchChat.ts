/**
 * Twitch Chat Controller
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import '@shared/prototypes.ts';
import { ChatClient } from '@twurple/chat';
import { MessageProcessor } from '@twitch/chat/MessageProcessor.ts';
import { clearTimer, getRandomNumber, log } from '@shared/helpers.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type {
	ChatCommunitySubInfo,
	ChatMessage,
	ChatPrimeCommunityGiftInfo,
	ChatRaidInfo,
	ChatSubGiftInfo,
	ChatSubGiftUpgradeInfo,
	ChatSubInfo,
	ChatSubUpgradeInfo,
	ClearChat,
	UserNotice
} from '@twurple/chat';
import type { HelixChatAnnouncementColor } from '@twurple/api';
import type { Twitch } from '@twitch/core/Twitch.ts';

export class TwitchChat
{
	public chatClient!: ChatClient;
	public messageProcessor!: MessageProcessor;
	// https://twurple.js.org/docs/examples/chat/sub-gift-spam.html
	private communitySubGifts = new Map<string | undefined, number>();
	private connectTimer: number = 0;

	constructor( private twitch: Twitch ) {}

	public async init(): Promise<void>
	{
		this.messageProcessor = new MessageProcessor( this.twitch );
		try
		{
			const authProvider = await this.twitch.twitchAuth.getAuthProvider('bot');
			this.chatClient = new ChatClient( {
				authProvider: authProvider!,
				channels: [  UserHelper.broadcasterName ]
			} );
			this.handleChatClientEvents();
			this.connect();
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Connect to Twitch Chat */
	public connect(): void
	{
		this.connectTimer = clearTimer( this.connectTimer );

		try
		{
			if (
				!this.chatClient.isConnected &&
				!this.chatClient.isConnecting
			) this.chatClient.connect();
		} catch ( error: unknown )
		{
			log( error );

			if ( error instanceof Error )
			{
				if ( error.message.toLowerCase().includes( 'connection already present' ) )
				{
					log( 'Skipping reconnect - connection exists' );
					return;
				}

				log( `Error connecting to Twitch Chat › retry in 30s` );
				this.connectTimer = setTimeout( () => this.connect(), 30000 );
			}
		}
	}

	/** Send message to chat
	 *
	 * @param {String} message - Message to send
	 * @param {ChatMessage} replyTo - Nick to reply to
	 */
	public async sendMessage( message: string = '', replyTo?: ChatMessage ): Promise<void>
	{
		if ( !message ) return;
		try
		{
			if ( replyTo )
			{
				await this.chatClient.say(  UserHelper.broadcasterName, message, {
					replyTo: replyTo
				} );
			}
			else
			{
				await this.chatClient.say(  UserHelper.broadcasterName, message );
			}

			log( message );
		} catch ( error: unknown )
		{ log( error ) }
	}

	/** Send action to chat (/me)
	 *
	 * @param {String} message - Message to send
	 */
	public async sendAction( message: string ): Promise<void>
	{
		if ( !message )
		{
			return;
		}
		const beeps = [
			'[Beep Bleep]',
			'[Bleep Prpz]',
			'[Prpz Boop]',
			'[Boop Prpz]',
			'[Prpz Bleep]',
			'[Bleep Beep]',
			'[Beep Boop]',
			'[Boop Prpz]',
			'[Prpz Bleep]',
			'[Boop Bleep]',
			'[Beep Bop]'
		];
		const beep = beeps[ getRandomNumber( beeps.length - 1 ) ] + ' ';

		try
		{
			await this.chatClient.action(  UserHelper.broadcasterName, beep + message );
			log( message );
		} catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Send announcement to chat (/announce(blue|green|orange|purple|primary))
	 *
	 * @param {String} message - The announcement to make in the broadcaster's chat room. Announcements are limited to a maximum of 500 characters; announcements longer than 500 characters are truncated.
	 * @param {HelixChatAnnouncementColor} color - The color used to highlight the announcement. If color is set to primary or is not set, the channel’s accent color is used to highlight the announcement.
	 */
	public async sendAnnouncement(
		message: string,
		color: HelixChatAnnouncementColor = 'primary'
	): Promise<void>
	{
		if ( !message )
		{
			return;
		}
		try
		{
			await this.twitch.twitchApi.chat.sendAnnouncement(
				UserHelper.broadcasterId,
				{
					color: color,
					message: message
				}
			);
			log( message );
		}
		catch ( error: unknown ) { log( error ) }
	}

	/** Sends a shoutout to the specified broadcaster.
	 *
	 * The broadcaster may send a shoutout once every 2 minutes. They may send the same broadcaster a shoutout once every 60 minutes.
	 *
	 * @param {string} toUserName
	 */
	public async sendShoutout( toUserName: string ): Promise<void>
	{
		if ( toUserName?.toLowerCase() ===  UserHelper.broadcasterName )
		{
			return;
		}

		// Check if its a chat message the needs to be split
		if ( toUserName.includes( ' ' ) )
		{
			const splittedMessage = toUserName.trim().split( ' ' );
			toUserName = splittedMessage[ 1 ] || '';
			if ( !toUserName )
			{
				return;
			}
		}

		const fromUser = await this.twitch.userHelper.getUser();
		const toUser = await this.twitch.userHelper.getUser( toUserName );
		if ( !fromUser || !toUser )
		{
			return;
		}

		try
		{
			await this.twitch.twitchApi.chat.shoutoutUser( fromUser, toUser );
			log( toUserName );
		} catch ( error: unknown )
		{
			log( error );
		}
	}

	/** Fires when the client successfully connects to the chat server */
	public onConnect = () =>
	{
		log( `Connected to Twitch Chat as ${  UserHelper.botName }` );
	};

	/** Fires when chat cleint disconnects
	 *
	 * @param {boolean} manually Whether the disconnect was requested by the user.
	 * @param {Error} reason The error that caused the disconnect, or undefined if there was no error.
	 */
	public onDisconnect = ( manually: boolean, reason?: Error ) =>
	{
		if ( manually )
		{
			log( `Disconnected (manually) ...` );
			return;
		}

		log( reason );
		log( `Disconnected unexpectedly › Trying to reconnect in 30s` )
		this.connectTimer = clearTimer( this.connectTimer );
		this.connectTimer = setTimeout( () =>
		{
			if ( !this.chatClient.isConnected && !this.chatClient.isConnecting )
			{
				log( 'Manual reconnect after timeout' );
				this.connect();
			}
		}, 60000 );
	};

	/** Fires when authentication fails.
	 *
	 * @param {string} text - The message text.
	 * @param {number} retryCount - The number of authentication attempts, including this one, that failed in the current attempt to connect.Resets when authentication succeeds.
	 */
	public onAuthenticationFailure = ( text: string, retryCount: number ) =>
	{
		log( `(${ retryCount }x) › ${ text }` );
	};

	/** Fires when a user sends a message to a channel.
	 *
	 * @param {string} channel - The channel the message was sent to.
	 * @param {string} user - The user that sent the message.
	 * @param {string} text - The message text.
	 * @param {ChatMessage} msg - The full message object containing all message and user information.
	 */
	public onMessage = (
		channel: string,
		user: string,
		text: string,
		msg: ChatMessage
	) =>
	{
		if ( !this.messageProcessor.validate( channel, user, text, msg ) ) return;

		log( `${ user }: '${ text }'` );

		// Trim text
		text = text.trim();
		if ( !text ) return;

		// Process command ...
		if ( text.isCommand() )
			void this.twitch.commands.process( text, msg );
		// ... or message
		else if ( !msg.isRedemption )
			void this.messageProcessor.process( text, msg );

		// First chatter event
		if ( msg.isFirst )
			void this.twitch.events.eventProcessor.process( {
				eventType: 'first',
				user: user,
				eventText: text
			} );

		// Cheer event
		if ( msg.isCheer )
			void this.twitch.events.eventProcessor.process( {
				eventType: 'cheer',
				user: user,
				eventText: text,
				eventCount: msg.bits
			} );
	};

	/** Fires when a user gifts random subscriptions to the community of a channel.
	 *
	 * @param {string} _channel - The channel that was subscribed to.
	 * @param {string} user - The gifting user.
	 * @param {ChatCommunitySubInfo} subInfo - Additional information about the community subscription.
	 * @param {UserNotice} _msg - The full message object containing all message and user information.
	 */
	public onCommunitySub = (
		_channel: string,
		user: string,
		subInfo: ChatCommunitySubInfo,
		_msg: UserNotice
	) =>
	{
		if ( !user || !subInfo ) return;

		// Get right event based on number of subs gifted
		let eventType = 'communitysub';
		const count = subInfo.count || 1;
		switch ( true )
		{
			case (count >= 5 && count < 10):
				eventType += '-2';
				break;

			case (count >= 10 && count < 20):
				eventType += '-3';
				break;

			case (count >= 20 && count < 50):
				eventType += '-4';
				break;

			case (count >= 50 && count < 100):
				eventType += '-5';
				break;

			case (count >= 100 && count < 200):
				eventType += '-6';
				break;

			case (count >= 200):
				eventType += '-7';
				break;

			default:
				eventType += '-1';
		}

		// Prevent sub spam
		const previousGiftCount = this.communitySubGifts.get( user ) || 0;
		this.communitySubGifts.set( user, previousGiftCount + count );
		log( `${ user }: Gifts ${ count } subs` );

		void this.twitch.events.eventProcessor.process( {
			eventType: eventType,
			user: user,
			eventCount: count
		} );
	};

	/** Fires when a user upgrades their gift subscription to a paid subscription in a channel.
	 *
	 * @param {string} _channel - The channel where the subscription was upgraded.
	 * @param {string} _user - The user that upgraded their subscription.
	 * @param {ChatSubGiftUpgradeInfo} _subInfo - Additional information about the subscription upgrade.
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onGiftPaidUpgrade = (
		_channel: string,
		_user: string,
		_subInfo: ChatSubGiftUpgradeInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo ) return;
		log( msg.userInfo.displayName );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'giftpaidupgrade',
			user: msg.userInfo
		} );
	};

	/** Fires when a user gifts a Twitch Prime benefit to the channel.
	 *
	 * @param {string} _channel - The channel where the benefit was gifted.
	 * @param {string} _user - The user that received the gift.
	 * @param {ChatPrimeCommunityGiftInfo} _subInfo - Additional information about the gift.
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onPrimeCommunityGift = (
		_channel: string,
		_user: string,
		_subInfo: ChatPrimeCommunityGiftInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo ) return;
		log( msg.userInfo.displayName );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'primecommunitygift',
			user: msg.userInfo
		} );
	};

	/** Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
	 *
	 * @param {string} _channel - The channel where the subscription was upgraded.
	 * @param {string} _user - The user that upgraded their subscription.
	 * @param {ChatSubUpgradeInfo} _subInfo - Additional information about the subscription upgrade
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onPrimePaidUpgrade = (
		_channel: string,
		_user: string,
		_subInfo: ChatSubUpgradeInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo ) return;
		log( msg.userInfo.displayName );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'sub',
			user: msg.userInfo,
			eventCount: 1
		} );
	};

	/** Fires when a user raids a channel.
	 *
	 * @param {string} _channel - The channel that was raided.
	 * @param {string} _user - The user that has raided the channel.
	 * @param {ChatRaidInfo} raidInfo - Additional information about the raid.
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onRaid = (
		_channel: string,
		_user: string,
		raidInfo: ChatRaidInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo || !raidInfo?.viewerCount ) return;
		log( `${ msg.userInfo.displayName }: ${ raidInfo.viewerCount } are raiding` );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'raid',
			user: msg.userInfo,
			eventCount: raidInfo.viewerCount
		} );
	};

	/** Fires when a user resubscribes to a channel.
	 *
	 * @param {string} _channel - The channel that was resubscribed to.
	 * @param {string} _user - The resubscribing user.
	 * @param {ChatSubInfo} subInfo - Additional information about the resubscription.
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onResub = (
		_channel: string,
		_user: string,
		subInfo: ChatSubInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo || !subInfo ) return;

		// Get right event based on number of months subscribed
		let eventType = 'resub';
		const count = subInfo.months || 1;
		switch ( true )
		{
			case (count < 4):
				eventType += '-1';
				break;

			case (count > 3 && count < 12):
				eventType += '-2';
				break;

			case (count > 11 && count < 23):
				eventType += '-3';
				break;

			case (count > 22 && count < 35):
				eventType += '-4';
				break;

			case (count > 34):
				eventType += '-5';
				break;
		}
		log( `${ msg.userInfo.displayName }: ${ count }x` );

		void this.twitch.events.eventProcessor.process( {
			eventType: eventType,
			user: msg.userInfo,
			eventCount: count,
			eventText: subInfo.message || ''
		} );
	};

	/** Fires when a user subscribes to a channel.
	 *
	 * TODO: check if this collides with onResub event
	 * TODO: check if this collides with onSubExtend event
	 *
	 * @param {string} _channel - The channel that was subscribed to.
	 * @param {string} _user - The subscribing user.
	 * @param {ChatSubInfo} subInfo - Additional information about the subscription.
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onSub = (
		_channel: string,
		_user: string,
		subInfo: ChatSubInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo || !subInfo ) return;
		log( `${ msg.userInfo.displayName }: ${ subInfo.months }` );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'sub',
			user: msg.userInfo,
			eventCount: subInfo.months || 1,
			eventText: subInfo.message || ''
		} );
	};

	/** Fires when a user gifts a subscription to a channel to another user.
	 * Community subs also fire multiple onSubGift events.
	 * To prevent alert spam, check Sub gift spam.
	 *
	 * @param {string} _channel - The channel that was subscribed to.
	 * @param {string} _recipientName - The user that the subscription was gifted to. The gifting user is defined in subInfo.gifter.
	 * @param {ChatSubGiftInfo} subInfo - Additional information about the community subscription.
	 * @param {UserNotice} msg - The full message object containing all message and user information.
	 */
	public onSubGift = (
		_channel: string,
		_recipientName: string,
		subInfo: ChatSubGiftInfo,
		msg: UserNotice
	) =>
	{
		if ( !msg?.userInfo || !subInfo ) return;

		const gifterName = subInfo.gifter || '';
		log( ` ${ gifterName }: ${ subInfo.months }` );

		// Prevent sub gift spam
		const previousGiftCount = this.communitySubGifts.get( gifterName ) || 0;
		if ( previousGiftCount > 0 )
		{
			this.communitySubGifts.set( gifterName, previousGiftCount - 1 );
			return;
		}

		// No Community Sub, so just fire the subgift event
		void this.twitch.events.eventProcessor.process( {
			eventType: 'subgift',
			user: msg.userInfo,
			eventCount: subInfo.months || 1,
			eventText: subInfo.message || ''
		} );
	};

	/** Fires when a user is permanently banned from a channel.
	 *
	 * @param {string} _channel - The channel the user is banned from.
	 * @param {string} user - The banned user.
	 * @param {ClearChat} _msg - The full message object containing all message and user information.
	 */
	public onBan = ( _channel: string, user: string, _msg: ClearChat ) =>
	{
		if ( !user ) return;
		log( user );

		void this.twitch.events.eventProcessor.process( {
			eventType: 'ban',
			user: user
		} );
	};

	/** Handle chat client events */
	private handleChatClientEvents()
	{
		this.chatClient.onConnect( this.onConnect );
		this.chatClient.onDisconnect( this.onDisconnect );
		this.chatClient.onAuthenticationFailure( this.onAuthenticationFailure );
		this.chatClient.onMessage( this.onMessage );
		this.chatClient.onCommunitySub( this.onCommunitySub );
		this.chatClient.onGiftPaidUpgrade( this.onGiftPaidUpgrade );
		this.chatClient.onPrimeCommunityGift( this.onPrimeCommunityGift );
		this.chatClient.onPrimePaidUpgrade( this.onPrimePaidUpgrade );
		this.chatClient.onRaid( this.onRaid );
		this.chatClient.onResub( this.onResub );
		this.chatClient.onSub( this.onSub );
		this.chatClient.onSubGift( this.onSubGift );
		this.chatClient.onBan( this.onBan );
	}
}
