/**
 * Twitch Commands
 * 
 * @author Wellington Estevo
 * @version 1.0.14
 */

import { OpenAI } from '../external/OpenAi.ts';
import { Youtube } from '../external/Youtube.ts';
import { log } from '@propz/helpers.ts';

import type { CommercialLength } from '@twurple/api';
import type { TwitchCommand, TwitchCommandOptions } from '@propz/types.ts';
import type { TwitchUtils } from './TwitchUtils.ts';

export class TwitchCommands
{
	public commands: Map<string, TwitchCommand> = new Map( Object.entries( {
		ad: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				this.twitch.startAds( parseInt( options.param || '180' ) as CommercialLength );
			},
			aliases: [ 'adbreak', 'werbung' ],
			onlyMods: true,
		},
		addquote: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.addQuote( options.message );
			},
			description: 'Zitat hinzufügen: !addquote author quote text',
			message: {
				de: 'Zitat erfolgreich gespeichert: #[count]',
				en: 'Quote successfully saved: #[count]'
			},
		},
		ai: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				if ( !this.twitch.isStreamActive ) return;
				return await OpenAI.handleAiRequest( options.message, options.sender.name );
			},
			aliases: [ 'ki' ],
			description: 'AI-Antwort im Twitch Chat',
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
		arc: {
			aliases: [ 'browser' ],
			message: 'Best Browser → https://arc.net',
			description: 'Bester Browser'
		},
		believe: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		bento: {
			message: 'Cool Bento Grids ▶️ https://bentogrids.com 🖼️',
			description: 'Coole Bentro Grids'
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
		chatscore: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.commandMessage,
					'messages'
				);
			},
			description: 'Anzahl geschriebener Chat-Nachrichten',
			message: {
				de: '[user] hat [count] Chat-Nachrichten geschrieben › Rank: [rank]',
				en: '[user] has written [count] chat messages › Rank: [rank]'
			},
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
		commands: {
			aliases: [ 'help' ],
			message: {
				de: 'Chat-Befehle? Schau mal hier ▶️ https://propz.de/twitch-commands',
				en: 'Chat commands? Check here ▶️ https://propz.de/twitch-commands'
			},
			description: ''
		},
		delphin: {
			aliases: [ 'delfin', 'dolphin', 'golfinho' ],
			hasSound: true
		},
		discord: {
			aliases: [ 'dc', 'ds' ],
			message: {
				de: 'Ab in die kreative Discord-Community ▶️ https://propz.de/discord/ 🚀',
				en: 'Join the creative Discord community ▶️ https://propz.de/discord/ 🚀'
			},
			description: 'Link zur Discord Community'
		},
		doro: {
			aliases: [ 'coach', 'coaching' ],
			message: {
				de: 'Coaching gefällig? Schau mal bei Doro vorbei ▶️ https://www.dorothea-penner.de/',
				en: 'In need of some coaching? Check out Doro ▶️ https://www.dorothea-penner.de/'
			},
			description: 'Link zu Doros Website'
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
				const emotes = Object.keys( this.twitch.data.emotes )
					.filter( key => key.startsWith( 'propz' ) )
					.join( ' ' );
				return options.commandMessage?.replace( '[emotes]', emotes );
			},
			description: 'Alle Emotes',
			message: {
				de: 'Twitch: [emotes] / BetterTTV: KEKW HAhaa ddHuh CouldYouNot WeSmart OMEGALUL POGGERS SnoopPls vibePls HeadBanging Dance catJAM PETTHEMODS 200IQ Loading',
				en: 'Twitch: [emotes] / BetterTTV: KEKW HAhaa ddHuh CouldYouNot WeSmart OMEGALUL POGGERS SnoopPls vibePls HeadBanging Dance catJAM PETTHEMODS 200IQ Loading'
			},
		},
		emotional: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		error: {
			cooldown: 30,
			aliases: [ 'fehler' ],
			hasVideo: true,
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
		figma: {
			message: {
				de: 'Figma › kollaboratives Design- und Prototyping-Tool ▶️ https://www.figma.com',
				en: 'Figma › collaborative design and prototyping tool ▶️ https://www.figma.com'
			},
			description: 'Design- und Prototyping-Tool'
		},
		first: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				return options.commandMessage?.replace( '[user]', this.twitch.streamFirstChatter );
			},
			description: 'First Chatter des Streams',
			message: {
				de: '[user] war heute die erste Chatterin 💬',
				en: '[user] was the first chatter today 💬'
			},
		},
		firstscore: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				return await this.twitch.getUserScoreText(
					options.param || options.sender.name,
					options.commandMessage,
					'firsts'
				);
			},
			message: {
				de: '[user] hat [count]x erste Chatterin › Rank: [rank]',
				en: '[user] has [count]x first chatter › Rank: [rank]'
			},
			description: 'First-Chat score'
		},
		fokus: {
			handler: ( options: TwitchCommandOptions ) =>
			{
				const focusTimer = this.twitch.handleFocus( parseInt( options.param || '10' ) );
				if ( !focusTimer ) return;
				return options.commandMessage?.replace( '[count]', focusTimer.toString() );
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
					options.commandMessage,
					'follow'
				);
			},
			aliases: [ 'follow' ],
			description: 'Wie lange du mir folgst',
			message: {
				de: '[user] folgt [broadcaster] seit: [count]',
				en: '[user] has been following [broadcaster] since: [count]'
			},
		},
		gameover: {
			cooldown: 60,
			hasSound: true,
			disableOnFocus: true
		},
		garnix: {
			cooldown: 20,
			aliases: [ 'ganiks' ],
			hasSound: true,
			disableOnFocus: true
		},
		github: {
			message: {
				de: 'Hier lebt das kreative Chaos ▶️ https://propz.de 🖥️',
				en: 'Here lives the creative chaos ▶️ https://propz.de 🖥️'
			},
			description: 'Hier lebt das kreative Chaos'
		},
		hallelujah: {
			aliases: [ 'halleluja', 'aleluia' ],
			hasSound: true,
			hasVideo: true,
			onlyMods: true
		},
		icq: {
			aliases: [ 'chat' ],
			hasSound: true,
			disableOnFocus: true
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
			hasSound: true,
		},
		jenny: {
			cooldown: 30,
			hasSound: true,
			disableOnFocus: true
		},
		joke: {
			aliases: [ 'witz' ],
			description: 'Da kommt nen Witz!',
			message: {
				de: [
					'Es gibt eine neue Band, die „1023 Megabytes“. Bisher hatten sie noch keinen Gig.',
					'Das Leben ist nicht #000 oder #fff',
					'Hab das Logo als Word Datei geschickt, ist das ok?',
					'Ich hatte ein Leben voller unbehandelter Fehler.',
					'Wofür steht das R in Rekursion? -> Rekursion.',
					'Was ist der Unterschied zwischen C++ und C? -> Nur 1.',
					'Was machen Jamaikaner mit ihren Vektoren? Sie rastern sie.',
					'Ich werde dich nicht bezahlen, aber es wird eine gute Erfahrung sein und du kannst es in dein Portfolio aufnehmen!',
					'Können Sie das Lorem Ipsum durch Beispieltext ersetzen?',
					'Der kürzeste IT-Witz? Es ist gleich fertig!',
					'Der zweitkürzeste IT-Witz? Es müsste jetzt funktionieren',
					'Der drittkürzeste IT-Witz? Bei mir läufts!',
					'Wieviele Softwareentwickler brauch man um eine Glühbirne auszutauschen? Keinen, ist ein Hardwareproblem.'
				],
				en: [
					'There’s a new band called “1023 Megabytes”. They haven’t had a gig yet.',
					'Life isn\'t #000 or #fff.',
					'I’ve sent you the logo in word format, is that ok?',
					'I\'ve had a life full of unhandled rejections.',
					'What does the R in Recursion stand for? -> Recursion.',
					'What is the difference between C++ and C? -> Just 1.',
					'What do Jamaicans do with their vectors? Rastarize them.',
					'I\'m not going to pay you, but it\'ll be good experience and you can put it in your portfolio!',
					'Can you replace the Lorem Ipsum with sample text?',
					'Three SQL Database Admins walked into a NoSQL bar. A little while later they walked out because they couldn’t find a table.',
					'A Web Designer Decided To Use Right Aligned Text. His Boss Yelled At Him For It, Because It Wasn’t Justified.',
					'What Happens When Comic Sans Walks Into A Bar? The Bartender Says, ‘We Don\'t Serve Your Type Here!’'
				]
			},
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
		killswitch:{
			handler: ( options: TwitchCommandOptions ) =>
			{
				this.twitch.toggleKillswitch();
				return options.commandMessage?.replace( '[text]', this.twitch.killswitch ? 'Activated' : 'Deactivated' );
			},
			message: {
				de: 'Killswitch [text]',
				en: 'Killswitch [text]'
			},
			onlyMods: true
		},
		ko: {
			cooldown: 60,
			hasVideo: true,
		},
		lachen: {
			aliases: [ 'laugh', 'laughter' ],
			hasSound: true,
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
				return options.commandMessage.replace( '[user]', options.sender.displayName );
			},
			description: 'Lurkstart',
			message: {
				de: [
					'[user] hat den Kreativitäts-Ninja-Modus aktiviert! 🕵️‍♂️ Viel Spaß beim Lurken!',
					'[user] hat den Lurk-Modus aktiviert 🌙 genieße die kreative Stille und tauch auf, wenn du bereit bist! 🚀',
					'[user] schleicht sich in die Kreativitätsnacht! 🌌 Wir sind bereit, wenn du wieder auftauchst!',
					'Lurk-Level für [user] aktiviert! 👁️ Tauch auf, wenn die Kreativität ruft!',
					'[user] ist im Lurk-Train! 🚂 Komm zurück, wenn du bereit für kreative Action bist!'
				],
				en: [
					'[user] has activated the Creativity Ninja Mode! 🕵️‍♂️ Enjoy lurking!',
					'[user] has activated Lurk Mode 🌙 enjoy the creative silence and pop up when you\'re ready! 🚀',
					'[user] sneaks into the night of creativity! 🌌 We\'re ready when you pop back up!',
					'Lurk level activated for [user]! 👁️ Pop up when creativity calls!',
					'[user] is on the Lurk Train! 🚂 Come back when you\'re ready for creative action!'
				]
			}
		},
		mahlzeit: {
			message: {
				de: 'Mahlzeit [user]! 🍽️',
				en: 'Mahlzeit [user]! 🍽️'
			},
			description: 'Selber Mahlzeit!'
		},
		mark: {
			handler: async ( options: TwitchCommandOptions ) =>
			{
				if ( !this.twitch.isStreamActive ) return;
				await this.twitch.api.streams.createStreamMarker( this.twitch.data.userId, options.message || 'Marker' );
				return `Marker created`;
			},
			aliases: [ 'marker' ],
			onlyMods: true
		},
		mission: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		money: {
			hasVideo: true,
			disableOnFocus: true
		},
		neubrutalism: {
			aliases: [ 'nb', 'neobrutalism' ],
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
		ohno: {
			cooldown: 60,
			hasVideo: true,
		},
		pause: {
			hasSound: true,
			disableOnFocus: true
		},
		penpot: {
			message: {
				de: 'Penpot › kostenlose Figma alternative ▶️ https://penpot.app',
				en: 'Penpot › free Figma alternative ▶️ https://penpot.app'
			},
			description: 'Figma for free'
		},
		projekt: {
			message: {
				de: 'Gute Frage was ich hier mache: Ich baue an meiner Website (PHP + WordPress), an meinem Twitch Bot (Node JS), an meinem Stream (OBS), designe dolle Sachen (Figma) und spreche über meine Selbständigkeit.',
				en: 'Good question what I\'m doing here: I\'m working on my website (PHP + WordPress), my Twitch bot (Node JS), my stream (OBS), designing cool stuff (Figma), and talking about my self-employment.'
			},
			description: 'Was ich mache'
		},
		propz: {
			message: {
				de: 'propz an dich! Guck mal hier ▶️ https://propz.de',
				en: 'propz back to you! Check out ▶️ https://propz.de'
			},
			description: 'Gib mal propz!'
		},
		psx: {
			cooldown: 120,
			hasSound: true,
			disableOnFocus: true
		},
		quack: {
			cooldown: 10,
			hasSound: true,
			disableOnFocus: true
		},
		quote: {
			description: 'Random quote.',
			handler: async (options: TwitchCommandOptions) =>
			{
				return await this.twitch.data.getQuote( options.message );
			}
		},
		raid: {
			handler: (options: TwitchCommandOptions) =>
			{
				this.twitch.startRaid( options.param );
			},
			onlyMods: true
		},
		rain: {
			cooldown: 60,
			description: 'Let it rain'
		},
		reload: {
			handler: async () =>
			{
				await this.twitch.reloadData();
				return 'Reloaded';
			},
			onlyMods: true
		},
		recraft: {
			message: {
				de: 'Bearbeitbare KI Bilder ▶️ https://www.recraft.ai',
				en: 'Editable AI images ▶️ https://www.recraft.ai'
			},
			description: 'Bearbeitbare KI Bilder'
		},
		reset: {
			obs: [
				{
					'requestType': 'SetSourceFilterEnabled',
					'requestData': {
						'sourceName': '[Video] Colorful',
						'sourceUuid': '',
						'filterName': 'reset',
						'filterEnabled': true
					}
				},
				{
					'requestType': 'SetSourceFilterEnabled',
					'requestData': {
						'sourceName': '[Video] Halloween',
						'sourceUuid': '',
						'filterName': 'reset',
						'filterEnabled': true
					}
				},
				{
					'requestType': 'SetSourceFilterEnabled',
					'requestData': {
						'sourceName': '[Video] Christmas',
						'sourceUuid': '',
						'filterName': 'reset',
						'filterEnabled': true
					}
				},
				{
					'requestType': 'SetSceneItemEnabled',
					'requestData': {
						'sceneName': '[R] VIDEOBOARD',
						'sceneUuid': '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						'sceneItemId': 10,
						'sceneItemEnabled': false
					}
				},
				{
					'requestType': 'SetSceneItemEnabled',
					'requestData': {
						'sceneName': '[R] VIDEOBOARD',
						'sceneUuid': '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						'sceneItemId': 5,
						'sceneItemEnabled': false
					}
				},
				{
					'requestType': 'SetSceneItemEnabled',
					'requestData': {
						'sceneName': '[R] VIDEOBOARD',
						'sceneUuid': '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						'sceneItemId': 41,
						'sceneItemEnabled': false
					}
				},
				{
					'requestType': 'SetSceneItemEnabled',
					'requestData': {
						'sceneName': '[R] VIDEOBOARD',
						'sceneUuid': '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						'sceneItemId': 40,
						'sceneItemEnabled': false
					}
				},
				{
					'requestType': 'SetSceneItemEnabled',
					'requestData': {
						'sceneName': '[R] VIDEOBOARD',
						'sceneUuid': '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						'sceneItemId': 6,
						'sceneItemEnabled': false
					}
				},
				{
					'requestType': 'SetSceneItemEnabled',
					'requestData': {
						'sceneName': '[R] VIDEOBOARD',
						'sceneUuid': '4580d8ec-31a7-40e3-b8a8-4f1399080904',
						'sceneItemId': 7,
						'sceneItemEnabled': false
					}
				},
				{
					'requestType': 'TriggerMediaInputAction',
					'requestData': {
						'inputName': '[Video] Fireworks Rain',
						'mediaAction': 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
					}
				},
				{
					'requestType': 'TriggerMediaInputAction',
					'requestData': {
						'inputName': '[Video] Fireworks Alert',
						'mediaAction': 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
					}
				},
				{
					'requestType': 'TriggerMediaInputAction',
					'requestData': {
						'inputName': '[Video] Bill Ted Guitar',
						'mediaAction': 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
					}
				},
				{
					'requestType': 'PressInputPropertiesButton',
					'requestData': {
						'inputName': '[Browser] Chat',
						'inputUuid': '',
						'propertyName': 'refreshnocache'
					}
				},
				{
					'requestType': 'PressInputPropertiesButton',
					'requestData': {
						'inputName': '[Browser] Alerts',
						'inputUuid': '',
						'propertyName': 'refreshnocache'
					}
				},
				{
					'requestType': 'PressInputPropertiesButton',
					'requestData': {
						'inputName': '[Browser] Mediaboard',
						'inputUuid': '',
						'propertyName': 'refreshnocache'
					}
				},
				{
					'requestType': 'PressInputPropertiesButton',
					'requestData': {
						'inputName': '[Browser] Stream Events',
						'inputUuid': '',
						'propertyName': 'refreshnocache'
					}
				},
				{
					'requestType': 'PressInputPropertiesButton',
					'requestData': {
						'inputName': '[Browser] Stream Events Vertical',
						'inputUuid': '',
						'propertyName': 'refreshnocache'
					}
				}
			],
			onlyMods: true
		},
		roadmap: {
			message: {
				de: 'Roadmaps für alle DEVs und die es werden wollen ▶️ https://roadmap.sh',
				en: 'Roadmaps for all DEVs and aspiring developers ▶️ https://roadmap.sh'
			},
			description: 'Roadmaps for Devs'
		},
		setgame: {
			handler: async (options: TwitchCommandOptions) =>
			{
				let game;
				const param = options.param.toLowerCase();
				if ( param.includes( 'software' ) )
				{
					game = await this.twitch.api.games.getGameByName( 'Software and Game Development' );
				}
				else if ( param.includes( 'chat' ) )
				{
					game = await this.twitch.api.games.getGameByName( 'Just Chatting' );
				}
				else
				{
					game = await this.twitch.api.games.getGameByName( options.param );
				}

				if ( !game ) return `Game not found`;

				try
				{
					await this.twitch.api.channels.updateChannelInfo( this.twitch.data.userId, { gameId: game.id } );
					return `Game set to '${game.name}'`;
				}
				catch ( error: unknown ) { log( error ) }
			},
			aliases: [ 'game', 'setcat', 'setcategory', 'cat' ],
			onlyMods: true
		},
		setlanguage: {
			handler: async (options: TwitchCommandOptions) =>
			{
				try
				{
					await this.twitch.api.channels.updateChannelInfo( this.twitch.data.userId, { language: options.message } );
					return `Language set to '${options.message}'`;
				}
				catch ( error: unknown ) { log( error ) }
			},
			aliases: [ 'setlang', 'lang', 'language' ],
			onlyMods: true
		},
		settitle: {
			handler: async (options: TwitchCommandOptions) =>
			{
				try
				{
					await this.twitch.api.channels.updateChannelInfo( this.twitch.data.userId, { title: options.message } );
					return `Title set to '${options.message}'`;
				}
				catch ( error: unknown ) { log( error ) }
			},
			aliases: [ 'title' ],
			onlyMods: true
		},
		slap: {
			handler: (options: TwitchCommandOptions) =>
			{
				return options.commandMessage
					?.replace( '[target]', options.param || options.sender.displayName )
					?.replace( '[user]', options.param ? options.sender.displayName : this.twitch.data.userDisplayName );
			},
			description: 'Slap them good',
			message: {
				de: '[user] 👋 slaps [target] around with a big large 🐟trout',
				en: '[user] 👋 slaps [target] around with a big large 🐟trout'
			},
		},
		snow: {
			hasVideo: true,
			cooldown: 30
		},
		so: {
			handler: (options: TwitchCommandOptions) =>
			{
				this.twitch.chat.sendShoutout( options.param );
			},
			onlyMods: true
		},
		soundboard: {
			handler: () =>
			{
				const sounds: string[] = [];
				for( const [index, command] of this.twitch.commands.commands.entries() )
				{
					if ( command.hasSound || command.hasVideo )
						sounds.push( `!${index}` );
				}
				return `▶️ ${sounds.join(', ')}`;
			},
			aliases: [ 'sb' ],
			description: 'Alle Sounds',
		},
		streamonline: {
			handler: () =>
			{
				this.twitch.sendStremOnlineDataToDiscord();
			},
			onlyMods: true
		},
		tee: {
			aliases: [ 'tea' ],
			message: {
				de: '🫖🫖🫖 Wie wärs mit nem Tee?! 🫖🫖🫖',
				en: '🫖🫖🫖 How about a tea?! 🫖🫖🫖'
			},
			description: '🫖'
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
		thinking: {
			aliases: [ 'think', 'denken', 'denk', 'nachdenk', 'nachdenken' ],
			hasVideo: true,
		},
		tnt: {
			hasVideo: true,
		},
		tools: {
			message: {
				de: 'Browser: https://arc.net / Design: https://www.figma.com / Coding: https://code.visualstudio.com / Orga: https://excalidraw.com https://www.notion.so / Stream: https://obsproject.com https://www.touch-portal.com https://restream.io / Twitch Bot: https://twurple.js.org / FTP: https://panic.com/transmit / CMS: https://wordpress.org',
				en: 'Browser: https://arc.net / Design: https://www.figma.com / Coding: https://code.visualstudio.com / Orga: https://excalidraw.com https://www.notion.so / Stream: https://obsproject.com https://www.touch-portal.com https://restream.io / Twitch: https://twurple.js.org / FTP: https://panic.com/transmit / CMS: https://wordpress.org'
			},
			description: 'Alle benutzen Tools'
		},
		tornado: {
			cooldown: 60,
			description: 'Tornado twister!'
		},
		twurple: {
			message: {
				de: 'Twurple für Twitch API ▶️ https://twurple.js.org',
				en: 'Twurple for Twitch API ▶️ https://twurple.js.org'
			},
			description: 'Twurple für Twitch API'
		},
		uizard: {
			message: {
				de: 'Prototyp mit KI ▶️ https://uizard.io',
				en: 'Prototype with AI ▶️ https://uizard.io'
			},
			description: 'Prototype with AI'
		},
		unlurk: {
			handler: (options: TwitchCommandOptions) =>
			{
				return options.commandMessage.replace('[user]', options.sender.displayName);
			},
			description: 'Lurkstop',
			message: {
				de: [
					'Willkommen zurück aus den Kreativ-Schatten, [user]! 🌟 Deine Rückkehr bringt frischen Wind in den Stream! ✨',
					'Der Lurk-Meister ist zurück! 💡 [user], bereit für neue Design-Abenteuer?',
					'Die Kreativitäts-Ninja ist wieder aufgetaucht! 🌌 Willkommen zurück, [user].',
					'[user] hat das Lurk-Kostüm ausgezogen! 👋 Willkommen zurück im kreativen Rampenlicht.',
					'Der Lurk-Modus ist vorbei - [user] kehrt zurück! 🚀 Freuen uns, dich wieder im Code-Kosmos zu haben!'
				],
				en: [
					'Welcome back from the creative shadows, [user]! 🌟 Your return brings fresh air to the stream! ✨',
					'The Lurk Master is back! 💡 [user], ready for new design adventures?',
					'The Creativity Ninja has resurfaced! 🌌 Welcome back, [user].',
					'[user] has shed the lurk costume! 👋 Welcome back to the creative spotlight.',
					'The Lurk mode is over - [user] returns! 🚀 Glad to have you back in the code cosmos!'
				]
			},
			
		},
		uptime: {
			description: 'So lange läuft der Stream',
			handler: (options: TwitchCommandOptions) =>
			{
				return this.twitch.getStreamUptimeText( options.commandMessage );
			},
			message: {
				de: 'Streame seit [count]',
				en: 'Streaming for [count]'
			},
		},
		vod: {
			description: 'Zum aktuellen VOD',
			handler: async (options: TwitchCommandOptions) =>
			{
				return options.commandMessage + await Youtube.getVodLink( this.twitch.isStreamActive );
			},
			message: {
				de: 'Zum aktuellen VOD ▶️ ',
				en: 'To the current VOD ▶️ '
			},
		},
		watchtime: {
			description: 'Zugeschaute Stunden',
			handler: async (options: TwitchCommandOptions) =>
			{
				return await this.twitch.getUserWatchtimeText(
					options.param || options.sender.name,
					options.commandMessage
				);
			},
			message: {
				de: '[user] guckt [broadcaster] fleißig zu: [count] › Rank: [rank]',
				en: '[user] is diligently watching [broadcaster]: [count] › Rank: [rank]'
			},
		},
		wasser: {
			aliases: [ 'water' ],
			message: {
				de: 'Zeit für nen Schluck H20 ▶️ 💦',
				en: 'Time for a sip of H2O ▶️ 💦'
			},
			description: '💦'
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
			hasSound: true,
			disableOnFocus: true
		},
		wololo: {
			cooldown: 20,
			hasSound: true,
			disableOnFocus: true
		},
		wtf: {
			cooldown: 60,
			hasVideo: true,
			disableOnFocus: true
		},
		wtfisgoingon: {
			hasSound: true,
			onlyMods: true
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
	}));

	private commandHistory: Map<string, number> = new Map();
	private twitch: TwitchUtils;
	constructor( twitch: TwitchUtils ) { this.twitch = twitch }

	/** Extracts the command name form chat message */
	getCommandNameFromMessage( chatMessage: string )
	{
		if ( !chatMessage ) return '';
		const chatMessageSplitted = chatMessage.trim().split( ' ' );
		const commandName = chatMessageSplitted[0].toLowerCase().replace( '!', '' );
		
		for ( const [cmdName, cmd] of this.commands.entries() )
			if ( cmd.aliases?.includes( commandName ) )
				return cmdName;

		return commandName;
	}

	/** Check if command is in cooldown */
	isCommandInCooldown( commandName: string )
	{
		if (
			!commandName ||
			!this.commands.get( commandName )?.cooldown
		) return false;

		if ( this.commandHistory.has( commandName ) )
		{
			if ( ( Date.now() * 1000 ) - this.commandHistory.get( commandName )! < this.commands.get( commandName )!.cooldown! )
				return true;
		
			this.commandHistory.delete( commandName );
		}

		this.commandHistory.set( commandName, Date.now() * 1000 );
		return false;
	}
}
