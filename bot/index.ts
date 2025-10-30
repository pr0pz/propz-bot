/**
 * Main Bot file
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';
import { ApiClient } from '@twurple/api';
import { Database } from '@services/Database.ts';
import { Server } from '@services/Server.ts';
import { BotData } from '@services/BotData.ts';
import { Websocket } from '@services/Websocket.ts';
import { Discord } from '@discord/Discord.ts';
import { Twitch } from '@twitch/core/Twitch.ts';
import { TwitchAuth } from '@twitch/core/TwitchAuth.ts';

class Bot
{
	private botData!: BotData;
	private discord!: Discord;
	private twitch!: Twitch;
	private twitchApi!: ApiClient;
	private twitchAuth!: TwitchAuth;
	private server!: Server;
	private ws!: Websocket;

	constructor()
	{
		this.handleExit();
	}

	public async init()
	{
		this.twitchAuth = new TwitchAuth();
		const botAuthProvider = await this.twitchAuth.getAuthProvider('bot');
		const broadcasterAuthProvider = await this.twitchAuth.getAuthProvider('broadcaster');

		this.twitchApi = new ApiClient( { authProvider: broadcasterAuthProvider! } );
		this.botData = new BotData( this.twitchApi );
		this.ws = new Websocket();
		this.discord = new Discord();
		this.twitch = new Twitch( this.botData, this.discord, this.ws, botAuthProvider! );
		this.server = new Server( this.ws, this.twitch, this.discord );
	}

	public async run()
	{
		await this.init();
		void this.server.start();
		void this.discord.connect();
		void this.twitch.init();
	}

	/** Disconnect and kill everything on quit */
	private handleExit(): void
	{
		Deno.addSignalListener( 'SIGINT', async () =>
		{
			await this.server.get().shutdown();

			if ( this.twitch.chat.chatClient )
				this.twitch.chat.chatClient.quit();

			if ( this.twitch.events.listener )
				this.twitch.events.listener.stop();

			if ( this.discord.client )
				await this.discord.client.destroy();

			const db = Database.getInstance();
			db.cleanupDatabase();
			db.close();

			log( 'SIGINT Shutdown 🔻' );

			Deno.exit();
		} );
	}
}

const bot = new Bot();
void bot.run();
