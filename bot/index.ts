/**
 * Main Bot file
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { ApiClient } from '@twurple/api';
import { Bot } from '@bot/Bot.ts';
import { BotData } from '@bot/BotData.ts';
import { BotWebsocket } from '@bot/BotWebsocket.ts';
import { Discord } from '@discord/Discord.ts';
import { Twitch } from '@twitch/core/Twitch.ts';
import { TwitchAuth } from '@twitch/core/TwitchAuth.ts';

const twitchAuth = new TwitchAuth();
const botAuthProvider = await twitchAuth.getAuthProvider('bot');
const broadcasterAuthProvider = await twitchAuth.getAuthProvider('broadcaster');
const twitchApi = new ApiClient( { authProvider: broadcasterAuthProvider! } );
const data = new BotData( twitchApi );
const ws = new BotWebsocket();
const discord = new Discord();
const twitch = new Twitch( data, discord, ws, botAuthProvider! );
const bot = new Bot( discord, twitch, ws );

bot.run();
