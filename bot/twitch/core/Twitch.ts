/**
 * Twitch Utils
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import '@shared/prototypes.ts';

import { log } from '@shared/helpers.ts';
import { Api } from '@modules/features/Api.ts';
import { ApiClient } from '@twurple/api';
import { BotData } from '@services/BotData.ts';
import { Commands } from '@twitch/commands/Commands.ts';
import { Cronjobs } from '@modules/features/Cronjobs.ts';
import { Emotes } from '@twitch/chat/Emotes.ts';
import { FirstChatter } from '@modules/features/FirstChatter.ts';
import { Focus } from '@modules/features/Focus.ts';
import { Killswitch } from '@modules/features/Killswitch.ts';
import { Spotify } from '@modules/integrations/Spotify.ts';
import { StreamEvents } from '@modules/features/StreamEvents.ts';
import { StreamHelper } from '@twitch/utils/StreamHelper.ts';
import { TwitchAuth } from '@twitch/core/TwitchAuth.ts';
import { TwitchChat } from '@twitch/chat/TwitchChat.ts';
import { TwitchEvents } from '@twitch/events/TwitchEvents.ts';
import { TwitchRewards } from '@twitch/core/TwitchRewards.ts';
import { UserConverter } from '@twitch/utils/UserConverter.ts';

import type { Websocket } from '@services/Websocket.ts';
import type { Discord } from '@discord/Discord.ts';

export class Twitch
{
	public api!: Api;
	public chat!: TwitchChat;
	public commands!: Commands;
	public cronjobs!: Cronjobs;
	public data!: BotData;
	public emotes!: Emotes;
	public events!: TwitchEvents;
	public killswitch = new Killswitch();
	public firstChatter!: FirstChatter;
	public focus!: Focus;
	public rewards!: TwitchRewards;
	public spotify = new Spotify();
	public stream!: StreamHelper;
	public streamEvents = new StreamEvents();
	public twitchApi!: ApiClient;
	public twitchAuth!: TwitchAuth;
	public userConverter!: UserConverter;

	public isDev: boolean = false;

	constructor( public ws: Websocket, public discord: Discord )
	{
		this.isDev = (Deno.args?.[ 0 ]?.toString() === 'dev');
	}

	/** Init Main Twitch Controller */
	public async init(): Promise<void>
	{
		// Critical Services that need auth data
		this.twitchAuth = new TwitchAuth();
		const broadcasterAuthProvider = await this.twitchAuth.getAuthProvider('broadcaster');
		this.twitchApi = new ApiClient( { authProvider: broadcasterAuthProvider! } );
		this.data = new BotData( this.twitchApi );

		// Load all modules
		this.api = new Api( this );
		this.chat = new TwitchChat( this );
		this.commands = new Commands( this );
		this.cronjobs = new Cronjobs( this );
		this.emotes = new Emotes( this.twitchApi );
		this.events = new TwitchEvents( this );
		this.firstChatter = new FirstChatter( this );
		this.focus = new Focus( this );
		this.rewards = new TwitchRewards( this.twitchApi );
		this.stream = new StreamHelper( this );
		this.userConverter = new UserConverter( this );

		// Init
		void this.data.init();
		void this.rewards.init();
		void this.emotes.init();
		void this.chat.init();
		this.events.startListener();
		await this.stream.set();
		this.cronjobs.run();

		log( 'Bot init ✅' );
	}
}
