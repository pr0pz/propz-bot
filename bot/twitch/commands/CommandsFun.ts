/**
 * Fun Commands
 * Interactive & Entertainment Commands (Jokes, Quotes, Games, etc.)
 *
 * @author Wellington Estevo
 * @version 2.0.12
 */

import { Jokes } from '@modules/features/Jokes.ts';
import { Quotes } from '@modules/features/Quotes.ts';
import { Giveaway } from '@modules/features/Giveaway.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { TwitchCommand, TwitchCommandOptions } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export default function createFunCommands(twitch: Twitch): Record<string, TwitchCommand> {
	return {
		addjoke: {
			handler: (options: TwitchCommandOptions) => {
				if (!options.messageObject) return '';
				const jokeNumber = Jokes.add(options.messageObject);
				return options.returnMessage.replace('[count]', jokeNumber);
			},
			description: 'Antworte auf eine Nachricht mit !addjoke um es zu den Jokes hinzuzufügen.',
			disableIfOffline: false,
			message: {
				de: 'Joke gespeichert: #[count]',
				en: 'Joke saved: #[count]'
			}
		},
		addquote: {
			handler: async (options: TwitchCommandOptions) => {
				if (!options.messageObject) return '';
				const quoteNumber = await Quotes.add(options.messageObject, options.stream);
				return options.returnMessage.replace('[count]', quoteNumber);
			},
			description: 'Antworte auf eine Nachricht mit !addquote um es zu den Quotes hinzuzufügen.',
			disableIfOffline: false,
			message: {
				de: 'Zitat gespeichert: #[count]',
				en: 'Quote saved: #[count]'
			}
		},
		giveaway: {
			message: {
				de: 'Zu gewinnen gibt es eine Obergeile Tasse aus Brasilien! - https://www.twitch.tv/propz_tv/clip/TawdrySecretiveOcelotKeyboardCat-Vp_K5XTm-JkSkfbg',
				en: 'You can win a wonderful mug from Brazil! - https://www.twitch.tv/propz_tv/clip/TawdrySecretiveOcelotKeyboardCat-Vp_K5XTm-JkSkfbg'
			}
		},
		joke: {
			description: 'Random joke!',
			handler: (options: TwitchCommandOptions) => {
				return Jokes.get(parseInt(options.param) || 0);
			}
		},
		kaffee: {
			aliases: ['coffee'],
			message: {
				de: '☕️☕️☕️ Gönnt euch erstmal nen Kaffee! ☕️☕️☕️',
				en: '☕️☕️☕️ Treat yourself to a coffee! ☕️☕️☕️'
			},
			description: '☕️'
		},
		keks: {
			aliases: ['cookie'],
			message: '🍪',
			description: '🍪'
		},
		klassetasse: {
			handler: (options: TwitchCommandOptions) => {
				if (!options.sender.id) return '';
				Giveaway.join(options.sender.id);
				return options.returnMessage.replace('[user]', options.sender.displayName);
			},
			message: {
				de: '@[user] nimmt jetzt Teil',
				en: '@[user] joined the giveaway'
			}
		},
		lurk: {
			handler: (options: TwitchCommandOptions) => {
				return options.returnMessage.replace(
					'[user]',
					options.sender.displayName
				);
			},
			description: 'Lurkstart',
			message: {
				de: [
					'@[user] hat den Kreativitäts-Ninja-Modus aktiviert! 🕵️‍♂️ Viel Spaß beim Lurken!',
					'@[user] hat den Lurk-Modus aktiviert 🌙 genieße die kreative Stille und tauch auf, wenn du bereit bist! 🚀',
					'@[user] schleicht sich in die Kreativitätsnacht! 🌌 Wir sind bereit, wenn du wieder auftauchst!',
					'Lurk-Level für @[user] aktiviert! 👁️ Tauch auf, wenn die Kreativität ruft!',
					'@[user] ist im Lurk-Train! 🚂 Komm zurück, wenn du bereit für kreative Action bist!'
				],
				en: [
					'@[user] has activated the Creativity Ninja Mode! 🕵️‍♂️ Enjoy lurking!',
					'@[user] has activated Lurk Mode 🌙 enjoy the creative silence and pop up when you\'re ready! 🚀',
					'@[user] sneaks into the night of creativity! 🌌 We\'re ready when you pop back up!',
					'Lurk level activated for @[user]! 👁️ Pop up when creativity calls!',
					'@[user] is on the Lurk Train! 🚂 Come back when you\'re ready for creative action!'
				]
			}
		},
		onlyfans: {
			aliases: ['of'],
			message: {
				de: 'Deine schmutzigen Geheimnisse findest du in deiner .env, du kleiner Perverser',
				en: 'Check your dirty secrets inside your .env you little perv'
			},
			description: 'My OF'
		},
		propz: {
			description: 'Just propz, plain and simple!',
			handler: (options: TwitchCommandOptions) => {
				void twitch.events.eventProcessor.process({
					eventType: 'propz',
					user: options.param || UserHelper.broadcasterName
				});
			}
		},
		quote: {
			description: 'Random Quotes.',
			handler: (options: TwitchCommandOptions) => {
				return Quotes.get(parseInt(options.param) || 0);
			}
		},
		slap: {
			handler: (options: TwitchCommandOptions) => {
				void twitch.events.eventProcessor.process({
					eventType: 'slap',
					user: options.param || options.sender.displayName,
					sender: options.param ?
						options.sender.displayName :
						UserHelper.broadcasterName
				});
			},
			description: 'Slap them good'
		},
		unlurk: {
		handler: (options: TwitchCommandOptions) => {
			return options.returnMessage.replace(
				'[user]',
				options.sender.displayName
			);
		},
		description: 'Lurkstop',
		message: {
			de: [
				'Willkommen zurück aus den Kreativ-Schatten, @[user]! 🌟 Deine Rückkehr bringt frischen Wind in den Stream! ✨',
				'Der Lurk-Meister ist zurück! 💡 @[user], bereit für neue Design-Abenteuer?',
				'Die Kreativitäts-Ninja ist wieder aufgetaucht! 🌌 Willkommen zurück, @[user].',
				'@[user] hat das Lurk-Kostüm ausgezogen! 👋 Willkommen zurück im kreativen Rampenlicht.',
				'Der Lurk-Modus ist vorbei - @[user] kehrt zurück! 🚀 Freuen uns, dich wieder im Code-Kosmos zu haben!'
			],
			en: [
				'Welcome back from the creative shadows, @[user]! 🌟 Your return brings fresh air to the stream! ✨',
				'The Lurk Master is back! 💡 @[user], ready for new design adventures?',
				'The Creativity Ninja has resurfaced! 🌌 Welcome back, @[user].',
				'@[user] has shed the lurk costume! 👋 Welcome back to the creative spotlight.',
				'The Lurk mode is over - @[user] returns! 🚀 Glad to have you back in the code cosmos!'
			]
		}
	}
	};
}
