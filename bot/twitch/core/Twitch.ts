/**
 * Twitch Utils
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import '@shared/prototypes.ts';

import { log } from '@shared/helpers.ts';
import { Api } from '@modules/features/Api.ts';
import { Commands } from '@twitch/commands/Commands.ts';
import { Cronjobs } from '@modules/features/Cronjobs.ts';
import { FirstChatter } from '@modules/features/FirstChatter.ts';
import { Focus } from '@modules/features/Focus.ts';
import { Killswitch } from '@modules/features/Killswitch.ts';
import { Spotify } from '@modules/integrations/Spotify.ts';
import { StreamEvents } from '@modules/features/StreamEvents.ts';
import { StreamHelper } from '@twitch/utils/StreamHelper.ts';
import { TwitchChat } from '@twitch/chat/TwitchChat.ts';
import { TwitchEvents } from '@twitch/events/TwitchEvents.ts';
import { TwitchRewards } from '@twitch/core/TwitchRewards.ts';
import { UserConverter } from '@twitch/utils/UserConverter.ts';

import type { BotData } from '@services/BotData.ts';
import type { Websocket } from '@services/Websocket.ts';
import type { Discord } from '@discord/Discord.ts';
import type { RefreshingAuthProvider } from '@twurple/auth';

export class Twitch
{
	public chat: TwitchChat;
	public events: TwitchEvents;
	public commands: Commands;

	public api: Api;
	public cronjobs: Cronjobs;
	public killswitch = new Killswitch();
	public firstChatter: FirstChatter;
	public focus: Focus;
	public rewards: TwitchRewards;
	public spotify = new Spotify();
	public stream: StreamHelper;
	public streamEvents = new StreamEvents();
	public userConverter: UserConverter;

	public isDev: boolean = false;

	constructor(
		public data: BotData,
		public discord: Discord,
		public ws: Websocket,
		public authProvider: RefreshingAuthProvider,
	)
	{
		if ( !discord ) throw new Error( 'Discord is empty' );
		if ( !data ) throw new Error( 'Data is empty' );
		if ( !ws ) throw new Error( 'Websocket is empty' );
		if ( !authProvider ) throw new Error( 'authProvider is empty' );

		this.api = new Api( this );
		this.chat = new TwitchChat( this );
		this.commands = new Commands( this );
		this.cronjobs = new Cronjobs( this );
		this.events = new TwitchEvents( this );
		this.firstChatter = new FirstChatter( this );
		this.focus = new Focus( this );
		this.rewards = new TwitchRewards( this.data.twitchApi );
		this.stream = new StreamHelper( this );
		this.userConverter = new UserConverter( this );

		// Running localy for testing?
		this.isDev = (Deno.args?.[ 0 ]?.toString() === 'dev');
	}

	/** Init Main Twitch Controller */
	public async init(): Promise<void>
	{
		void this.data.init();
		void this.rewards.init();
		this.chat.connect();
		this.events.startListener();
		await this.stream.set();
		this.cronjobs.run();

		log( 'Bot init ✅' );
	}
}
