/**
 * Main Bot file
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

import { log } from '@propz/helpers.ts';
import { ApiClient } from '@twurple/api';
import { BotData } from './bot/BotData.ts';
import { Discord } from './discord/Discord.ts';
import { TwitchAuth } from './twitch/TwitchAuth.ts';
import { Twitch } from './twitch/Twitch.ts';
import { Bot } from './bot/Bot.ts';
import { BotWebsocket } from './bot/BotWebsocket.ts';

const twitchAuth = new TwitchAuth();
const authProvider = await twitchAuth.getAuthProvider();
if ( !authProvider )
{
	log( new Error( 'authProvider not working' ) );
	Deno.exit(1);
}

const twitchApi = new ApiClient({ authProvider: authProvider });
const data = new BotData( twitchApi );
const ws = new BotWebsocket();
const discord = new Discord( data );
const twitch = new Twitch( data, discord, ws );
const bot = new Bot( discord, twitch, ws );

bot.run();