import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';
import { Server } from '@services/Server.ts';
import { Websocket } from '@services/Websocket.ts';
import { Discord } from '@discord/Discord.ts';
import { Twitch } from '@twitch/core/Twitch.ts';

class Bot
{
	private server!: Server;
	private readonly discord!: Discord;
	private readonly twitch!: Twitch;
	private readonly ws!: Websocket;

	constructor()
	{
		this.handleExit();
		this.ws = new Websocket();
		this.discord = new Discord();
		this.twitch = new Twitch( this.ws, this.discord );
		this.server = new Server( this.ws, this.twitch, this.discord );
	}

	public run()
	{
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
				this.twitch.events.stop();

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
