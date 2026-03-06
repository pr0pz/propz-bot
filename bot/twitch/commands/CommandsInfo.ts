import { Rankings } from '@modules/features/Rankings.ts';
import { UserData } from '@services/UserData.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { TwitchCommand, TwitchCommandOptions } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export default function createInfoCommands(twitch: Twitch): Record<string, TwitchCommand> {
	return {
		br: {
			aliases: ['businessrauschen'],
			message: {
				de: 'Business Rauschen › Der Businesstalk mit @dorothea_coaching ▶️ https://business-rauschen.de 🖼️',
				en: 'Business Noise › The Businesstalk with @dorothea_coaching ▶️ https://business-rauschen.de 🖼️'
			},
			description: 'Business Rauschen Website'
		},
		chatbubble: {
			aliases: [ "bubble" ],
			message: {
				de: "propztSPINNER Style deine eigene Chatbubble: https://propz.de/twitch-dashboard/",
				en: "propztSPINNER Style your own Chat bubble: https://propz.de/twitch-dashboard/"
			}
		},
		chatscore: {
			description: 'Anzahl geschriebener Chat-Nachrichten',
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'message_count',
					twitch.userHelper
				);
			},
			message: {
				de: '@[user] hat [count] Chat-Nachrichten geschrieben › Rank: [rank]',
				en: '@[user] has written [count] chat messages › Rank: [rank]'
			}
		},
		chatranking: {
			description: 'Wer sind die Top chatter?',
			handler: (_options: TwitchCommandOptions) => {
				return Rankings.getRankingText('message_count', UserData.getAll());
			}
		},
		dailydev: {
			message: {
				de: 'Die besten DEV News ▶️ https://propz.de/dailydev',
				en: 'Check out the best dev news ▶️ https://propz.de/dailydev'
			}
		},
		discord: {
			aliases: ['dc'],
			message: {
				de: 'Ab in die kreative Discord-Community ▶️ https://propz.de/discord/ 🚀',
				en: 'Join the creative Discord community ▶️ https://propz.de/discord/ 🚀'
			},
			description: 'Link zur Discord Community'
		},
		donate: {
			aliases: ['kofi'],
			description: 'Support the Stream',
			message: {
				de: 'Unterstütze den kreativen Flow mit einer Runde virtuellen Kaffee! ☕ https://propz.de/donate',
				en: 'Support the creative flow with a virtual coffee! ☕ https://propz.de/donate'
			}
		},
		doro: {
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
		first: {
			handler: (options: TwitchCommandOptions) => {
				return options.returnMessage?.replace(
					'[user]',
					twitch.firstChatter.get()
				);
			},
			description: 'First Chatter des Streams',
			message: {
				de: '@[user] war heute die erste Chatterin 💬',
				en: '@[user] was the first chatter today 💬'
			}
		},
		firstscore: {
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'first_count',
					twitch.userHelper
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
			handler: (_options: TwitchCommandOptions) => {
				return Rankings.getRankingText('first_count', UserData.getAll());
			}
		},
		floripa: {
			message: 'Floripa › https://maps.app.goo.gl/nh8erwbu112ytM3V7'
		},
		followage: {
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'follow_date',
					twitch.userHelper
				);
			},
			aliases: ['follow'],
			description: 'Wie lange du mir folgst',
			message: {
				de: '@[user] folgt [broadcaster] seit: [count]',
				en: '@[user] has been following [broadcaster] since: [count]'
			}
		},
		giftscore: {
			description: 'Wer hat am meisten Subs verschenkt?',
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'gift_count',
					twitch.userHelper
				);
			},
			message: {
				de: '@[user] hat [count] Abos verschenkt › Rank: [rank]',
				en: '@[user] gifted [count] Subs › Rank: [rank]'
			}
		},
		giftranking: {
			description: 'Wer sind die Top Sub gifter?',
			handler: (_options: TwitchCommandOptions) => {
				return Rankings.getRankingText('gift_subs', UserData.getAll());
			}
		},
		github: {
			message: {
				de: 'Creative Coding Chaos par excellence ▶️ https://propz.de/github/ 💻',
				en: 'Creative Coding Chaos par excellence ▶️ https://propz.de/github/ 💻'
			},
			description: 'Creative Coding Chaos'
		},
		hetzner: {
			message: {
				de: 'Preisgekrönte Cloud Server & VPS mit bestem Preis-Leistungs-Verhältnis bei Hetzner ⚡ https://propz.de/hetzner [Werbung]',
				en: 'Award winning Cloud Server & VPS with the best price-performance ratio at Hetzner! ⚡ https://propz.de/hetzner [Ad]',
			}
		},
		instagram: {
			aliases: ['insta'],
			message: {
				de: 'Influencer für arme ▶️ https://propz.de/instagram/ 🌄',
				en: 'Influencer for the poor ▶️ https://propz.de/instagram/ 🌄'
			},
			description: 'Influencer für arme'
		},
		neubrutalism: {
			message: {
				de: 'Neu Brutalism ▶️ https://dribbble.com/search/neo-brutalism',
				en: 'Neo Brutalism ▶️ https://dribbble.com/search/neo-brutalism'
			},
			description: 'NB Beispiele'
		},
		prime: {
			message: {
				de: 'Wenn du ein Amazon Prime Konto hast, kannst du dieses mit Twitch verbinden. Jeden Monat hast du die Möglichkeit einen Streamer deiner Wahl KOSTENLOS zu Subscriben! @propz_tv würde sich über DEINEN Prime-Sub sehr freuen! › twitch.tv/subs/propz_tv',
				en: 'If you have an Amazon Prime account, you can connect it to Twitch. Every month, you have the opportunity to subscribe to a streamer of your choice for FREE! @propz_tv would be very happy to receive YOUR Prime subscription! › twitch.tv/subs/propz_tv'
			}
		},
		protonmail: {
			message: {
				de: 'Sichere E-Mail, die Ihre Privatsphäre schützt › https://propz.de/proton-mail [Werbung]',
				en: 'Secure email that protects your privacy › https://propz.de/proton-mail [Ad]'
			}
		},
		protonpass: {
			aliases: ['proton'],
			message: {
				de: 'Der datenschutzfreundliche Passwortmanager, dem Streamer vertrauen › https://propz.de/proton-pass [Werbung]',
				en: 'The privacy focused password manager that streamers trust › https://propz.de/proton-pass [Ad]'
			}
		},
		protonvpn: {
			aliases: ['vpn'],
			message: {
				de: 'Surfen Sie privat mit einem sicheren VPN, das Ihre Privatsphäre schützt. › https://propz.de/proton-vpn [Werbung]',
				en: 'Browse privately with a secure VPN that safeguards your privacy. › https://propz.de/proton-vpn [Ad]'
			}
		},
		raidscore: {
			description: 'Wie oft hat der User geraidet?',
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'raid_count',
					twitch.userHelper
				);
			},
			message: {
				de: '@[user] hat uns [count]x geraidet › Rank: [rank]',
				en: '@[user] raided us [count]x times › Rank: [rank]'
			}
		},
		raidranking: {
			description: 'Wer sind die Top Raider?',
			handler: (_options: TwitchCommandOptions) => {
				return Rankings.getRankingText('raid_count', UserData.getAll());
			}
		},
		roadmap: {
			message: {
				de: 'Roadmaps für alle DEVs und die es werden wollen ▶️ https://roadmap.sh',
				en: 'Roadmaps for all DEVs and aspiring developers ▶️ https://roadmap.sh'
			},
			description: 'Roadmaps for Devs'
		},
		subscore: {
			description: 'Anzahl gesubbter Monate',
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserScoreText(
					options.param || options.sender.name,
					options.returnMessage,
					'sub_count',
					twitch.userHelper
				);
			},
			message: {
				de: '@[user] hat [count] Monate aboniert › Rank: [rank]',
				en: '@[user] subbed [count] months › Rank: [rank]'
			}
		},
		subranking: {
			description: 'Wer sind die Top subber?',
			handler: (_options: TwitchCommandOptions) => {
				return Rankings.getRankingText('sub_count', UserData.getAll());
			}
		},
		testconf: {
			// message: {
			// 	de: 'TECH STREAM CONFERENCE 🚀 Alle Infos hier ▶️ https://test-conf.de',
			// 	en: 'TECH STREAM CONFERENCE 🚀 All Informations here ▶️ https://test-conf.de'
			// },
			message: "TECH STREAM CONFERENCE 🚀 'The State of CSS 2025' Talk: https://www.youtube.com/watch?v=uHL_u7Cqpyk",
			description: 'Beste Konferenz'
		},
		tiktok: {
			message: {
				de: 'Tiktok Trends für Kreative ▶️ https://propz.de/tiktok/ 📺',
				en: 'Tiktok Trends for Creatives ▶️ https://propz.de/tiktok/ 📺'
			},
			description: 'Trends für Kreative'
		},
		tools: {
			message: {
				de: 'Browser: https://arc.net / Design: https://www.figma.com / Coding: https://code.visualstudio.com / Orga: https://excalidraw.com https://www.notion.so / Stream: https://obsproject.com https://www.touch-portal.com https://restream.io / Twitch Bot: https://twurple.js.org / FTP: https://panic.com/transmit / CMS: https://wordpress.org',
				en: 'Browser: https://arc.net / Design: https://www.figma.com / Coding: https://code.visualstudio.com / Orga: https://excalidraw.com https://www.notion.so / Stream: https://obsproject.com https://www.touch-portal.com https://restream.io / Twitch: https://twurple.js.org / FTP: https://panic.com/transmit / CMS: https://wordpress.org'
			},
			description: 'Alle benutzen Tools'
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
		watchtime: {
			description: 'Zugeschaute Stunden',
			handler: async (options: TwitchCommandOptions) => {
				return await Rankings.getUserWatchtimeText(
					options.param || options.sender.name,
					options.returnMessage,
					UserHelper.broadcasterName
				);
			},
			message: {
				de: '@[user] guckt [broadcaster] fleißig zu: [count] › Rank: [rank]',
				en: '@[user] is diligently watching [broadcaster]: [count] › Rank: [rank]'
			}
		},
		web: {
			message: {
				de: 'Hier lebt das kreative Chaos ▶️ https://propz.de 🖥️',
				en: 'Here lives the creative chaos ▶️ https://propz.de 🖥️'
			},
			description: 'Hier lebt das kreative Chaos'
		},
		youtube: {
			aliases: ['yt'],
			message: {
				de: 'Da gibt es so Videos ▶️ https://propz.de/youtube/ 📺',
				en: 'There are some videos ▶️ https://propz.de/youtube/ 📺'
			},
			description: 'Videos und VOD\'s'
		}
	};
}
