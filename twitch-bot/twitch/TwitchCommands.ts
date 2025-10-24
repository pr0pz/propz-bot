/**
 * Twitch Commands
 *
 * @author Wellington Estevo
 * @version 1.10.2
 */

import { log, sanitizeMessage } from '@propz/helpers.ts';
import { Deepl } from '../modules/Deepl.ts';
import { Gemini } from '../modules/Gemini.ts';
import { Giveaway } from '../modules/Giveaway.ts';
import { OpenWeather } from '../modules/OpenWeather.ts';
import { Quote } from '../modules/Quote.ts';
import { Youtube } from '../modules/Youtube.ts';

import type { TwitchCommand, TwitchCommandOptions } from '@propz/types.ts';
import type { TwitchUtils } from './TwitchUtils.ts';

export class TwitchCommands
{
	private commandHistory: Map<string, number> = new Map();
	private twitch: TwitchUtils;
	public commands: Map<string, TwitchCommand> = new Map( Object.entries( {
		ad: {
			handler: ( _options: TwitchCommandOptions ) =>
			{
				try
				{
					this.twitch.data.twitchApi.channels.startChannelCommercial(
						this.twitch.data.userId,
						180
					);
				}
				catch ( error: unknown )
				{
					log( error );
				}
			},
			aliases: [ 'adbreak', 'werbung' ],
			disableIfOffline: true,
			onlyMods: true
		},
		addjoke: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				if ( !options.messageObject ) return '';
				return this.twitch.addJoke( options.messageObject );
			},
			description: 'Antworte auf eine Nachricht mit !addjoke um es zu den Jokes hinzuzufügen.',
			disableIfOffline: false,
			message: {
				de: 'Joke gespeichert: #[count]',
				en: 'Joke saved: #[count]'
			}
		},
		addquote: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				if ( !options.messageObject ) return '';
				const quoteNumber = await Quote.add( options.messageObject, options.stream );
				return options.returnMessage.replace( '[count]', quoteNumber );
			},
			description: 'Antworte auf eine Nachricht mit !addquote um es zu den Quotes hinzuzufügen.',
			disableIfOffline: false,
			message: {
				de: 'Zitat gespeichert: #[count]',
				en: 'Quote saved: #[count]'
			}
		},
		ai: {
			aliases: [ 'ki' ],
			description: 'AI-Antwort im Twitch Chat',
			disableIfOffline: true,
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await Gemini.generate(
					options.message,
					options.sender.name || this.twitch.data.userDisplayName
				);
			}
		},
		aimeme: {
			cooldown: 60,
			disableOnFocus: true,
			hasVideo: true
		},
		airhorn: {
			aliases: [ 'horn' ],
			hasSound: true,
			onlyMods: true
		},
		alarm: {
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		applaus: {
			aliases: [ 'applause' ],
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		ban: {
			cooldown: 120,
			handler: ( options: TwitchCommandOptions ) =>
			{
				void this.twitch.processEvent( {
					eventType: 'ban',
					user: options.param,
					isTest: true
				} );
			},
			disableOnFocus: true
		},
		banger: {
			description: 'Fügt den aktuellen Song zur "Absolute Banger" Playlist',
			disableIfOffline: true,
			handler: async ( options: TwitchCommandOptions ) =>
			{
				const song = await this.twitch.spotify.addBangerToPlaylist();
				if ( song.includes( 'Error' ) ) return song;
				return options.returnMessage?.replace(
					'[song]',
					song
				);
			},
			message: {
				de: `'[song]' ist jetzt ein absoluter Banger! › https://propz.de/absolute-banger`,
				en: `'[song]' is now an absolute Banger! › https://propz.de/absolute-banger`
			}
		},
		believe: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		br: {
			aliases: [ 'businessrauschen' ],
			message: {
				de: 'Business Rauschen › Der Businesstalk mit @dorothea_coaching ▶️ https://business-rauschen.de 🖼️',
				en: 'Business Noise › The Businesstalk with @dorothea_coaching ▶️ https://business-rauschen.de 🖼️'
			},
			description: 'Business Rauschen Website'
		},
		bruh: {
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		buh: {
			aliases: [ 'booh' ],
			hasSound: true,
			onlyMods: true
		},
		calmdown: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		chat: {
			aliases: [ 'icq' ],
			description: 'Ein Zeichen, dass propz den Chat durchlesen soll',
			hasSound: 'icq',
			disableOnFocus: true
		},
		chatscore: {
			description: 'Anzahl geschriebener Chat-Nachrichten',
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'message_count'
				);
			},
			message: {
				de: '@[user] hat [count] Chat-Nachrichten geschrieben › Rank: [rank]',
				en: '@[user] has written [count] chat messages › Rank: [rank]'
			}
		},
		chatranking: {
			description: 'Wer sind die Top chatter?',
			handler: ( _options: TwitchCommandOptions ) =>
			{
				return this.twitch.getRankingText( 'message_count' );
			}
		},
		chatting: {
			message: 'Scene changed: CHATTING',
			onlyMods: true,
			obs: [
				{
					requestType: 'SetCurrentProgramScene',
					requestData: {
						sceneName: '[S] CHATTING'
					}
				}
			]
		},
		christmas: {
			cooldown: 30,
			aliases: [ 'xmas' ],
			hasSound: true,
			hasVideo: true,
			disableOnFocus: true
		},
		clear: {
			message: 'Stream interface cleared',
			onlyMods: true
		},
		clearstats: {
			handler: ( _options: TwitchCommandOptions ) =>
			{
				this.twitch.data.db.execute( `DELETE FROM stream_stats;` );
				return 'Deleted current Stream stats';
			},
			onlyMods: true
		},
		commands: {
			aliases: [ 'help', 'comandos', 'dashboard' ],
			message: {
				de: 'Chat-Befehle? Schau mal hier ▶️ https://propz.de/twitch-dashboard',
				en: 'Chat commands? Check here ▶️ https://propz.de/twitch-dashboard'
			},
			description: ''
		},
		dailydev: {
			message: {
				de: 'Die besten DEV News ▶️ https://propz.de/dailydev',
				en: 'Check out the best dev news ▶️ https://propz.de/dailydev'
			}
		},
		delphin: {
			aliases: [ 'delfin', 'dolphin', 'golfinho' ],
			hasSound: true,
			disableOnFocus: true
		},
		donate: {
			aliases: [ 'kofi' ],
			description: 'Support the Stream',
			message: {
				de: 'Unterstütze den kreativen Flow mit einer Runde virtuellen Kaffee! ☕ https://propz.de/donate',
				en: 'Support the creative flow with a virtual coffee! ☕ https://propz.de/donate'
			}
		},
		discord: {
			aliases: [ 'dc' ],
			message: {
				de: 'Ab in die kreative Discord-Community ▶️ https://propz.de/discord/ 🚀',
				en: 'Join the creative Discord community ▶️ https://propz.de/discord/ 🚀'
			},
			description: 'Link zur Discord Community'
		},
		dogado: {
			message: {
				de: 'Hosting made in Germany: Super schnelle NVMe VPS mit ISO zertifizierten Support ⚡ https://propz.de/dogado-vps [Werbung]',
				en: 'Hosting made in Germany: Super fast NVMe VPS with ISO certified Support ⚡ https://propz.de/dogado-vps [Ad]',
			}
		},
		doro: {
			message: {
				de: 'Coaching gefällig? Schau mal bei Doro vorbei ▶️ https://www.dorothea-penner.de/',
				en: 'In need of some coaching? Check out Doro ▶️ https://www.dorothea-penner.de/'
			},
			description: 'Link zu Doros Website'
		},
		drumroll: {
			cooldown: 60,
			disableOnFocus: true,
			hasSound: true
		},
		dummtopf: {
			message: {
				de: 'Da klingelt die Kasse › Das macht 1€ bitte',
				en: 'The cash register rings › That\'ll be 1€ please'
			},
			description: '1€ Spende für jeden dummen Fehler'
		},
		emotes: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				const emotes = this.twitch.data.emotes
					.entries()
					.map( ( [ key, _value ] ) => key )
					.toArray()
					.filter( ( value ) => value.startsWith( 'propz' ) )
					.join( ' ' );
				return options.returnMessage?.replace( '[emotes]', emotes );
			},
			description: 'Alle Emotes',
			message: {
				de: 'Twitch: [emotes] / BetterTTV: KEKW HAhaa ddHuh CouldYouNot WeSmart OMEGALUL POGGERS SnoopPls vibePls HeadBanging Dance catJAM PETTHEMODS 200IQ Loading',
				en: 'Twitch: [emotes] / BetterTTV: KEKW HAhaa ddHuh CouldYouNot WeSmart OMEGALUL POGGERS SnoopPls vibePls HeadBanging Dance catJAM PETTHEMODS 200IQ Loading'
			}
		},
		emotional: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		ende: {
			aliases: [ 'end' ],
			message: 'Scene changed: END',
			onlyMods: true,
			obs: [
				{
					requestType: 'SetCurrentProgramScene',
					requestData: {
						sceneName: '[S] ENDE'
					}
				}
			]
		},
		error: {
			cooldown: 30,
			aliases: [ 'fehler' ],
			hasVideo: true
		},
		event: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				this.twitch.sendTestEvent( options.message );
			},
			onlyMods: true
		},
		falsch: {
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		first: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				return options.returnMessage?.replace(
					'[user]',
					this.twitch.firstChatter
				);
			},
			description: 'First Chatter des Streams',
			message: {
				de: '@[user] war heute die erste Chatterin 💬',
				en: '@[user] was the first chatter today 💬'
			}
		},
		firstscore: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'first_count'
				);
			},
			message: {
				de: '@[user] war [count]x erste Chatterin › Rank: [rank]',
				en: '@[user] was [count]x first chatter › Rank: [rank]'
			},
			description: 'First-Chat score'
		},
		firstranking: {
			description: 'Wer sind die Top first chatter?',
			handler: ( _options: TwitchCommandOptions ) =>
			{
				return this.twitch.getRankingText( 'first_count' );
			}
		},
		floripa: {
			message: 'Floripa › https://maps.app.goo.gl/nh8erwbu112ytM3V7'
		},
		fokus: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				const focusTimer = this.twitch.handleFocus(
					parseInt( options.param || '10' )
				);
				if ( !focusTimer ) return;
				return options.returnMessage?.replace( '[count]', focusTimer.toString() );
			},
			aliases: [ 'focus' ],
			message: {
				de: 'Fokus-Modus für [count]M gestartet',
				en: 'Focus mode activated for [count]M'
			},
			onlyMods: true
		},
		followage: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'follow_date'
				);
			},
			aliases: [ 'follow' ],
			description: 'Wie lange du mir folgst',
			message: {
				de: '@[user] folgt [broadcaster] seit: [count]',
				en: '@[user] has been following [broadcaster] since: [count]'
			}
		},
		garnix: {
			cooldown: 20,
			aliases: [ 'ganiks' ],
			hasSound: true,
			disableOnFocus: true
		},
		giftscore: {
			description: 'Wer hat am meisten Subs verschenkt?',
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'gift_count'
				);
			},
			message: {
				de: '@[user] hat [count] Abos verschenkt › Rank: [rank]',
				en: '@[user] gifted [count] Subs › Rank: [rank]'
			}
		},
		giftranking: {
			description: 'Wer sind die Top Sub gifter?',
			handler: ( _options: TwitchCommandOptions ) =>
			{
				return this.twitch.getRankingText( 'gift_subs' );
			}
		},
		github: {
			message: {
				de: 'Creative Coding Chaos par excellence ▶️ https://propz.de/github/ 💻',
				en: 'Creative Coding Chaos par excellence ▶️ https://propz.de/github/ 💻'
			},
			description: 'Creative Coding Chaos'
		},
		giveaway: {
			message: {
				de: 'Zu gewinnen gibt es eine Obergeile Tasse aus Brasilien!',
				en: 'You can win a wonderful mug from Brazil!'
			}
		},
		hallelujah: {
			aliases: [ 'halleluja', 'aleluia' ],
			hasSound: true,
			hasVideo: true,
			onlyMods: true
		},
		instagram: {
			aliases: [ 'insta' ],
			message: {
				de: 'Influencer für arme ▶️ https://propz.de/instagram/ 🌄',
				en: 'Influencer for the poor ▶️ https://propz.de/instagram/ 🌄'
			},
			description: 'Influencer für arme'
		},
		internet: {
			aliases: [ 'internetz', 'dial' ],
			disableOnFocus: true,
			hasSound: true
		},
		jenny: {
			cooldown: 30,
			hasSound: true,
			disableOnFocus: true
		},
		joke: {
			description: 'Random joke!',
			handler: ( options: TwitchCommandOptions ) =>
			{
				return this.twitch.data.getJoke( parseInt( options.param ) || 0 );
			}
		},
		junge: {
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		kaching: {
			hasSound: true,
			disableOnFocus: true
		},
		kaffee: {
			aliases: [ 'coffee' ],
			message: {
				de: '☕️☕️☕️ Gönnt euch erstmal nen Kaffee! ☕️☕️☕️',
				en: '☕️☕️☕️ Treat yourself to a coffee! ☕️☕️☕️'
			},
			description: '☕️'
		},
		keks: {
			aliases: [ 'cookie' ],
			message: '🍪',
			description: '🍪'
		},
		killswitch: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				this.twitch.toggleKillswitch();
				return options.returnMessage?.replace(
					'[text]',
					this.twitch.killswitch ? 'Activated' : 'Deactivated'
				);
			},
			message: {
				de: 'Killswitch [text]',
				en: 'Killswitch [text]'
			},
			onlyMods: true
		},
		klassetasse: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				if ( !options.sender.id ) return '';
				Giveaway.join( options.sender.id );
				return options.returnMessage.replace( '[user]', options.sender.displayName );
			},
			message: {
				de: '@[user] nimmt jetzt Teil',
				en: '@[user] joined the giveaway'
			}
		},
		ko: {
			cooldown: 60,
			hasVideo: true,
		},
		haha: {
			hasSound: 'lachen',
			onlyMods: true
		},
		letsgo: {
			aliases: [ 'okletsgo' ],
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		lurk: {
			handler: ( options: TwitchCommandOptions ) =>
			{
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
		mark: {
			aliases: [ 'marker' ],
			disableIfOffline: true,
			handler: async ( options: TwitchCommandOptions ) =>
			{
				try
				{
					await this.twitch.data.twitchApi.streams.createStreamMarker(
						this.twitch.data.userId,
						options.message || 'Marker'
					);
					return `Marker created`;
				}
				catch ( error: unknown )
				{
					log( error );
					return 'Failed to create marker';
				}
			},
			onlyMods: true
		},
		money: {
			hasVideo: true,
			disableOnFocus: true
		},
		neubrutalism: {
			message: {
				de: 'Neu Brutalism ▶️ https://dribbble.com/search/neo-brutalism',
				en: 'Neo Brutalism ▶️ https://dribbble.com/search/neo-brutalism'
			},
			description: 'NB Beispiele'
		},
		nice: {
			cooldown: 120,
			hasSound: true,
			disableOnFocus: true
		},
		onlyfans: {
			aliases: [ 'of' ],
			message: {
				de: 'Deine schmutzigen Geheimnisse findest du in deiner .env, du kleiner Perverser',
				en: 'Check your dirty secrets inside your .env you little perv'
			},
			description: 'My OF'
		},
		pause: {
			hasSound: true,
			message: 'Scene changed: PAUSE',
			onlyMods: true,
			obs: [
				{
					requestType: 'SetCurrentProgramScene',
					requestData: {
						sceneName: '[S] PAUSE'
					}
				}
			]
		},
		playlist: {
			description: 'Link zur aktuellen Playlist',
			handler: async ( _options: TwitchCommandOptions ) =>
			{
				return await this.twitch.spotify.getCurrentPlaylist();
			}
		},
		prime: {
			message: {
				de: 'Wenn du ein Amazon Prime Konto hast, kannst du dieses mit Twitch verbinden. Jeden Monat hast du die Möglichkeit einen Streamer deiner Wahl KOSTENLOS zu Subscriben! @propz_tv würde sich über DEINEN Prime-Sub sehr freuen! › twitch.tv/subs/propz_tv',
				en: 'If you have an Amazon Prime account, you can connect it to Twitch. Every month, you have the opportunity to subscribe to a streamer of your choice for FREE! @propz_tv would be very happy to receive YOUR Prime subscription! › twitch.tv/subs/propz_tv'
			}
		},
		propz: {
			description: 'Just propz, plain and simple!',
			handler: ( options: TwitchCommandOptions ) =>
			{
				void this.twitch.processEvent( {
					eventType: 'propz',
					user: options.param || this.twitch.data.userName
				} );
			}
		},
		protonmail: {
			message: {
				de: 'Sichere E-Mail, die Ihre Privatsphäre schützt › https://propz.de/proton-mail [Werbung]',
				en: 'Secure email that protects your privacy › https://propz.de/proton-mail [Ad]'
			}
		},
		protonpass: {
			aliases: [ 'proton' ],
			message: {
				de: 'Der datenschutzfreundliche Passwortmanager, dem Streamer vertrauen › https://propz.de/proton-pass [Werbung]',
				en: 'The privacy focused password manager that streamers trust › https://propz.de/proton-pass [Ad]'
			}
		},
		protonvpn: {
			aliases: [ 'vpn' ],
			message: {
				de: 'Surfen Sie privat mit einem sicheren VPN, das Ihre Privatsphäre schützt. › https://propz.de/proton-vpn [Werbung]',
				en: 'Browse privately with a secure VPN that safeguards your privacy. › https://propz.de/proton-vpn [Ad]'
			}
		},
		pun: {
			cooldown: 20,
			disableOnFocus: true,
			hasSound: true
		},
		quote: {
			description: 'Random quote.',
			handler: ( options: TwitchCommandOptions ) =>
			{
				return Quote.get( parseInt( options.param ) || 0 );
			}
		},
		raid: {
			disableIfOffline: true,
			handler: async ( options: TwitchCommandOptions ) =>
			{
				try
				{
					const target = await this.twitch.data.getUser( options.param );
					if ( !target ) return;

					const raid = await this.twitch.data.twitchApi.raids.startRaid(
						this.twitch.data.userId,
						target.id
					);
					if ( !raid ) return;

					void this.twitch.processEvent( {
						eventType: 'startraid',
						user: target
					} );
				}
				catch ( error: unknown )
				{
					log( error );
				}
			},
			onlyMods: true
		},
		raidscore: {
			description: 'Wie oft hat der User geraidet?',
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'raid_count'
				);
			},
			message: {
				de: '@[user] hat uns [count]x geraidet › Rank: [rank]',
				en: '@[user] raided us [count]x times › Rank: [rank]'
			}
		},
		raidranking: {
			description: 'Wer sind die Top Raider?',
			handler: ( _options: TwitchCommandOptions ) =>
			{
				return this.twitch.getRankingText( 'raid_count' );
			}
		},
		reload: {
			handler: async () =>
			{
				await this.twitch.reloadConfig();
				return 'Reloaded';
			},
			onlyMods: true
		},
		reloadcss: {
			handler: () => ''
		},
		reset: {
			obs: [
				{
					requestType: 'SetSourceFilterEnabled',
					requestData: {
						sourceName: '[Video] Colorful',
						sourceUuid: '',
						filterName: 'reset',
						filterEnabled: true
					}
				},
				{
					requestType: 'SetSceneItemEnabled',
					requestData: {
						sceneName: '[R] VIDEOBOARD',
						sceneUuid: '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						sceneItemId: 10,
						sceneItemEnabled: false
					}
				},
				{
					requestType: 'SetSceneItemEnabled',
					requestData: {
						sceneName: '[R] VIDEOBOARD',
						sceneUuid: '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						sceneItemId: 5,
						sceneItemEnabled: false
					}
				},
				{
					requestType: 'SetSceneItemEnabled',
					requestData: {
						sceneName: '[R] VIDEOBOARD',
						sceneUuid: '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						sceneItemId: 41,
						sceneItemEnabled: false
					}
				},
				{
					requestType: 'SetSceneItemEnabled',
					requestData: {
						sceneName: '[R] VIDEOBOARD',
						sceneUuid: '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						sceneItemId: 40,
						sceneItemEnabled: false
					}
				},
				{
					requestType: 'SetSceneItemEnabled',
					requestData: {
						sceneName: '[R] VIDEOBOARD',
						sceneUuid: '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						sceneItemId: 6,
						sceneItemEnabled: false
					}
				},
				{
					requestType: 'SetSceneItemEnabled',
					requestData: {
						sceneName: '[R] VIDEOBOARD',
						sceneUuid: '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						sceneItemId: 7,
						sceneItemEnabled: false
					}
				},
				{
					requestType: 'TriggerMediaInputAction',
					requestData: {
						inputName: '[Video] Fireworks Rain',
						mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
					}
				},
				{
					requestType: 'TriggerMediaInputAction',
					requestData: {
						inputName: '[Video] Fireworks Alert',
						mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
					}
				},
				{
					requestType: 'TriggerMediaInputAction',
					requestData: {
						inputName: '[Video] Bill Ted Guitar',
						mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
					}
				},
				{
					requestType: 'PressInputPropertiesButton',
					requestData: {
						inputName: '[Browser] Chat',
						inputUuid: '',
						propertyName: 'refreshnocache'
					}
				},
				{
					requestType: 'PressInputPropertiesButton',
					requestData: {
						inputName: '[Browser] Alerts/Mediaboard',
						inputUuid: '',
						propertyName: 'refreshnocache'
					}
				},
				{
					requestType: 'PressInputPropertiesButton',
					requestData: {
						inputName: '[Browser] Mediaboard',
						inputUuid: '',
						propertyName: 'refreshnocache'
					}
				},
				{
					requestType: 'PressInputPropertiesButton',
					requestData: {
						inputName: '[Browser] Stream Events',
						inputUuid: '',
						propertyName: 'refreshnocache'
					}
				},
				{
					requestType: 'PressInputPropertiesButton',
					requestData: {
						inputName: '[Browser] Focus',
						inputUuid: '',
						propertyName: 'refreshnocache'
					}
				},
				{
					requestType: 'PressInputPropertiesButton',
					requestData: {
						inputName: '[Browser] Wetter',
						inputUuid: '',
						propertyName: 'refreshnocache'
					}
				},
				{
					requestType: 'SetSourceFilterEnabled',
					requestData: {
						sourceName: '[Clone] Webcam (Desktop)',
						sourceUuid: '',
						filterName: 'reset-zoom',
						filterEnabled: true
					}
				}
			],
			onlyMods: true
		},
		rewardsongrequest: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				const track = await this.twitch.spotify.addToQueue( options.param );
				if ( track.includes( 'Error' ) )
					return track;

				return options.returnMessage.replace( '[song]', track );
			},
			message: {
				de: '[song] zur Warteschlange hinzugefügt',
				en: '[song] added to queue'
			}
		},
		roadmap: {
			message: {
				de: 'Roadmaps für alle DEVs und die es werden wollen ▶️ https://roadmap.sh',
				en: 'Roadmaps for all DEVs and aspiring developers ▶️ https://roadmap.sh'
			},
			description: 'Roadmaps for Devs'
		},
		setgame: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				try
				{
					let game;
					const param = options.param.toLowerCase();
					if ( param.includes( 'software' ) )
					{
						game = await this.twitch.data.twitchApi.games.getGameByName(
							'Software and Game Development'
						);
					}
					else if ( param.includes( 'chat' ) )
					{
						game = await this.twitch.data.twitchApi.games.getGameByName(
							'Just Chatting'
						);
					}
					else
					{
						game = await this.twitch.data.twitchApi.games.getGameByName(
							options.param
						);
					}

					if ( !game )
					{
						return `Game not found`;
					}

					await this.twitch.data.twitchApi.channels.updateChannelInfo(
						this.twitch.data.userId,
						{
							gameId: game.id
						}
					);
					return options.returnMessage.replace( '[game]', game.name );
				}
				catch ( error: unknown )
				{
					log( error );
				}
			},
			aliases: [ 'game', 'setcat', 'setcategory', 'cat' ],
			message: 'Stream Game set to \'[game]\'',
			onlyMods: true
		},
		setlanguage: {
			aliases: [ 'setlang', 'lang', 'language' ],
			handler: async ( options: TwitchCommandOptions ) =>
			{
				try
				{
					await this.twitch.data.twitchApi.channels.updateChannelInfo(
						this.twitch.data.userId,
						{
							language: options.message
						}
					);
					return options.returnMessage.replace( '[language]', options.message );
				}
				catch ( error: unknown )
				{
					log( error );
				}
			},
			onlyMods: true,
			message: 'Stream Language set to \'[language]\''
		},
		settitle: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				try
				{
					await this.twitch.data.twitchApi.channels.updateChannelInfo(
						this.twitch.data.userId,
						{
							title: options.message
						}
					);
					return options.returnMessage.replace( '[title]', options.message );
				}
				catch ( error: unknown )
				{
					log( error );
				}
			},
			aliases: [ 'title', 'setstreamtitle' ],
			message: 'Stream Title set to \'[title]\'',
			onlyMods: true
		},
		skiptrack: {
			description: '2 votes to skip a Song',
			handler: async ( _options: TwitchCommandOptions ) =>
			{
				return await this.twitch.spotify.skipToNext();
			}
		},
		slap: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				void this.twitch.processEvent( {
					eventType: 'slap',
					user: options.param || options.sender.displayName,
					sender: options.param ?
						options.sender.displayName :
						this.twitch.data.userDisplayName
				} );
			},
			description: 'Slap them good'
		},
		snow: {
			hasVideo: true,
			cooldown: 30
		},
		so: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				void this.twitch.chat.sendShoutout( options.param );
			},
			onlyMods: true
		},
		song: {
			description: 'Der aktuelle Song',
			handler: async ( _options: TwitchCommandOptions ) =>
			{
				return await this.twitch.spotify.getCurrentSong();
			}
		},
		soundboard: {
			handler: () =>
			{
				const sounds: string[] = [];
				for (
					const [ index, command ] of this.twitch.commands.commands.entries()
				)
				{
					if ( command.hasSound || command.hasVideo )
					{
						sounds.push( `!${index}` );
					}
				}
				return `▶️ ${sounds.join( ', ' )}`;
			},
			aliases: [ 'sb' ],
			description: 'Alle Sounds'
		},
		scene: {
			aliases: [ 'szene' ],
			handler: ( options: TwitchCommandOptions ) =>
			{
				if (
					!options?.message ||
					!options.sender
				)
				{
					return '';
				}

				let sceneName = options.message;
				if ( options.message.toLowerCase().includes( 'desktop' ) )
				{
					sceneName = '[S] DESKTOP';
				}
				else if ( options.message.toLowerCase().includes( 'chat' ) )
				{
					sceneName = '[S] CHATTING';
				}
				else if ( options.message.toLowerCase().includes( 'pause' ) )
				{
					sceneName = '[S] PAUSE';
				}
				else if ( options.message.toLowerCase().includes( 'ende' ) )
				{
					sceneName = '[S] ENDE';
				}

				this.twitch.ws.maybeSendWebsocketData( {
					type: 'command',
					user: options.sender,
					text: 'scene',
					obs: [
						{
							requestType: 'SetCurrentProgramScene',
							requestData: {
								sceneName: sceneName
							}
						}
					]
				} );

				return options.returnMessage.replace( '[sceneName]', sceneName );
			},
			message: 'Scene changed: [sceneName]',
			onlyMods: true
		},
		start: {
			message: 'Scene changed: START',
			obs: [
				{
					requestType: 'SetCurrentProgramScene',
					requestData: {
						sceneName: '[S] START'
					}
				}
			],
			onlyMods: true
		},
		startgiveaway: {
			handler: () =>
			{
				Giveaway.start();
				return 'Giveaway raffle just started!';
			},
			onlyMods: true
		},
		streamonline: {
			handler: () =>
			{
				void this.twitch.sendStreamOnlineDataToDiscord();
			},
			onlyMods: true
		},
		streamstart: {
			aliases: [ 'startstream' ],
			message: 'Starting stream ...',
			obs: [
				{
					requestType: 'StartStream'
				}
			],
			onlyMods: true
		},
		streamstop: {
			aliases: [ 'stopstream', 'endstream', 'streamend' ],
			message: 'Stopping Stream ...',
			obs: [
				{
					requestType: 'StopStream'
				}
			],
			onlyMods: true
		},
		subscore: {
			description: 'Anzahl gesubbter Monate',
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'sub_count'
				);
			},
			message: {
				de: '@[user] hat [count] Monate aboniert › Rank: [rank]',
				en: '@[user] subbed [count] months › Rank: [rank]'
			}
		},
		subranking: {
			description: 'Wer sind die Top subber?',
			handler: ( _options: TwitchCommandOptions ) =>
			{
				return this.twitch.getRankingText( 'sub_count' );
			}
		},
		test: {
			message: {
				de: 'Test bestanden ▶️ Scheint zu funzen 🔥',
				en: 'Test passed ▶️ Seems to work 🔥'
			},
			description: 'Läuft alles?'
		},
		testconf: {
			message: {
				de: 'TECH STREAM CONFERENCE 🚀 Alle Infos hier ▶️ https://test-conf.de',
				en: 'TECH STREAM CONFERENCE 🚀 All Informations here ▶️ https://test-conf.de'
			},
			description: 'Beste Konferenz'
		},
		tiktok: {
			message: {
				de: 'Tiktok Trends für Kreative ▶️ https://propz.de/tiktok/ 📺',
				en: 'Tiktok Trends for Creatives ▶️ https://propz.de/tiktok/ 📺'
			},
			description: 'Trends für Kreative'
		},
		time: {
			handler: ( _options: TwitchCommandOptions ) =>
			{
				return new Date().toLocaleTimeString( 'de-DE', {
					timeZone: 'Europe/Berlin'
				} );
			}
		},
		thinking: {
			aliases: [ 'think', 'denken', 'denk', 'nachdenk', 'nachdenken' ],
			hasVideo: true
		},
		tnt: {
			hasVideo: true
		},
		tools: {
			message: {
				de: 'Browser: https://arc.net / Design: https://www.figma.com / Coding: https://code.visualstudio.com / Orga: https://excalidraw.com https://www.notion.so / Stream: https://obsproject.com https://www.touch-portal.com https://restream.io / Twitch Bot: https://twurple.js.org / FTP: https://panic.com/transmit / CMS: https://wordpress.org',
				en: 'Browser: https://arc.net / Design: https://www.figma.com / Coding: https://code.visualstudio.com / Orga: https://excalidraw.com https://www.notion.so / Stream: https://obsproject.com https://www.touch-portal.com https://restream.io / Twitch: https://twurple.js.org / FTP: https://panic.com/transmit / CMS: https://wordpress.org'
			},
			description: 'Alle benutzen Tools'
		},
		translate: {
			aliases: [ 't' ],
			disableIfOffline: true,
			handler: async ( options: TwitchCommandOptions ) =>
			{
				if ( !options.messageObject ) return;
				// Check if command as sent as reply
				if ( options.messageObject.isReply )
				{
					const message = sanitizeMessage(
						options.messageObject.parentMessageText ?? ''
					);
					if ( this.twitch.isValidMessageText( message, options.messageObject ) )
					{
						const translation = await Deepl.translate(
							message,
							this.twitch.streamLanguage
						);
						void this.twitch.chat.sendMessage( translation, options.messageObject );
						return '';
					}
				}
				return await Deepl.translate(
					options.message,
					this.twitch.streamLanguage
				);
			}
		},
		tucalendi: {
			message: {
				de: 'Vollständig KI-gemanagte Terminbuchung 🗓️ https://www.tucalendi.com/de/ [Werbung]',
				en: 'Fully AI-powered appointment booking 🗓️ https://www.tucalendi.com/en/ [Ad]'
			}
		},
		twurple: {
			message: {
				de: 'Twurple für Twitch API ▶️ https://twurple.js.org',
				en: 'Twurple for Twitch API ▶️ https://twurple.js.org'
			},
			description: 'Twurple für Twitch API'
		},
		unlurk: {
			handler: ( options: TwitchCommandOptions ) =>
			{
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
		},
		uwu: {
			cooldown: 30,
			hasVideo: true,
			disableOnFocus: true
		},
		vod: {
			description: 'Zum aktuellen VOD',
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return options.returnMessage +
					await Youtube.getVodLink( this.twitch.isStreamActive );
			},
			message: {
				de: 'Zum aktuellen VOD ▶️ ',
				en: 'To the current VOD ▶️ '
			}
		},
		watchtime: {
			description: 'Zugeschaute Stunden',
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserWatchtimeText(
					options.param || options.sender.name,
					options.returnMessage
				);
			},
			message: {
				de: '@[user] guckt [broadcaster] fleißig zu: [count] › Rank: [rank]',
				en: '@[user] is diligently watching [broadcaster]: [count] › Rank: [rank]'
			}
		},
		weather: {
			aliases: [ 'wetter', 'tempo' ],
			disableIfOffline: true,
			handler: async ( options: TwitchCommandOptions ) =>
			{
				if ( !options.param )
				{
					options.param = 'Florianopolis';
				}

				const weatherData = await OpenWeather.handleWeatherRequest(
					options.param,
					'',
					this.twitch.streamLanguage
				);

				if ( !weatherData?.temp )
				{
					return `Nah`;
				}

				return options.returnMessage
					.replace( '[cityName]', weatherData.cityName )
					.replace( '[countryCode]', weatherData.countryCode )
					.replace( '[humidity]', weatherData.humidity )
					.replace( '[temp]', weatherData.temp )
					.replace( '[feelsLike]', weatherData.feelsLike )
					.replace( '[description]', weatherData.description );
			},
			message: {
				de: 'In [cityName] ([countryCode]) ists gerade [temp]° ([feelsLike]°)  ▶️  [description] mit [humidity]% Luftfeuchtigkeit',
				en: 'The temp in [cityName] ([countryCode]) is [temp]° ([feelsLike]°) ▶️ [description] with [humidity]% humidity'
			}
		},
		web: {
			message: {
				de: 'Hier lebt das kreative Chaos ▶️ https://propz.de 🖥️',
				en: 'Here lives the creative chaos ▶️ https://propz.de 🖥️'
			},
			description: 'Hier lebt das kreative Chaos'
		},
		wild: {
			cooldown: 20,
			disableOnFocus: true,
			hasSound: true
		},
		win: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				const winnerCount = options.param ? parseInt( options.param ) : 1;
				const winners = Giveaway.pickWinners( winnerCount );
				if ( !winners ) return 'Something went wrong, ask the shitty coder!';

				return options.returnMessage.replace(
					'[user]',
					winners.map( user => user[1] ).join( ', @' )
				);
			},
			message: {
				de: 'Herzlichen Glückwunsch an @[user] - DU HAST GEWONNEN 🎉🎉🎉',
				en: 'Congratulations to @[user] - YOU WON 🎉🎉🎉'
			},
			onlyMods: true
		},
		wololo: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		wtf: {
			cooldown: 120,
			disableOnFocus: true,
			hasSound: 'wtfisgoingon'
		},
		yeah: {
			cooldown: 20,
			aliases: [ 'yeahboi', 'yeahboy' ],
			hasSound: true,
			disableOnFocus: true
		},
		youtube: {
			aliases: [ 'yt' ],
			message: {
				de: 'Da gibt es so Videos ▶️ https://propz.de/youtube/ 📺',
				en: 'There are some videos ▶️ https://propz.de/youtube/ 📺'
			},
			description: 'Videos und VOD\'s'
		}
	} ) );

	constructor( twitch: TwitchUtils )
	{
		this.twitch = twitch;
	}

	/** Extracts the command name form chat message */
	getCommandNameFromMessage( chatMessage: string )
	{
		if ( !chatMessage )
		{
			return '';
		}

		const [ ...matches ] = chatMessage.matchAll( /^(?:@\w+\s)?!(\w+)/ig );
		const commandName = matches?.[0]?.[1] ?? '';

		for ( const [ cmdName, cmd ] of this.commands.entries() )
		{
			if ( cmd.aliases?.includes( commandName ) )
			{
				return cmdName;
			}
		}

		return commandName;
	}

	/** Check if command is in cooldown */
	isCommandInCooldown( commandName: string )
	{
		if (
			!commandName ||
			!this.commands.get( commandName )?.cooldown
		)
		{
			return false;
		}

		const timestamp = Date.timestamp();
		if ( this.commandHistory.has( commandName ) )
		{
			if (
				timestamp - this.commandHistory.get( commandName )! <
					this.commands.get( commandName )!.cooldown!
			)
			{
				return true;
			}

			this.commandHistory.delete( commandName );
		}

		this.commandHistory.set( commandName, timestamp );
		return false;
	}
}
