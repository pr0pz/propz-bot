/**
 * Utilities Commands
 * Bot Utilities & Tool Commands (AI, Translation, Weather, Spotify, etc.)
 *
 * @author Wellington Estevo
 * @version 2.0.3
 */

import { Deepl } from '@modules/integrations/Deepl.ts';
import { Gemini } from '@modules/integrations/Gemini.ts';
import { OpenWeather } from '@modules/integrations/OpenWeather.ts';
import { Spotify } from '@modules/integrations/Spotify.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';
import { Youtube } from '@modules/integrations/Youtube.ts';

import type { TwitchCommand, TwitchCommandOptions } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export default function createUtilitiesCommands(twitch: Twitch): Record<string, TwitchCommand> {
	return {
		ai: {
			aliases: ['ki'],
			description: 'AI-Antwort im Twitch Chat',
			disableIfOffline: true,
			handler: async (options: TwitchCommandOptions) => {
				return await Gemini.generate(
					options.message,
					options.sender.name || UserHelper.broadcasterName
				);
			}
		},
		banger: {
			description: 'Fügt den aktuellen Song zur "Absolute Banger" Playlist',
			disableIfOffline: true,
			handler: async (options: TwitchCommandOptions) => {
				const song = await Spotify.addBangerToPlaylist();
				if (song.includes('Error')) return song;
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
		commands: {
			aliases: ['help', 'comandos', 'dashboard'],
			message: {
				de: 'Chat-Befehle? Schau mal hier ▶️ https://propz.de/twitch-dashboard',
				en: 'Chat commands? Check here ▶️ https://propz.de/twitch-dashboard'
			},
			description: ''
		},
		emotes: {
			handler: (options: TwitchCommandOptions) => {
				const emotes = twitch.emotes.get()
					.entries()
					.map(([key, _value]) => key)
					.toArray()
					.filter((value) => value.startsWith('propz'))
					.join(' ');
				return options.returnMessage?.replace('[emotes]', emotes);
			},
			description: 'Alle Emotes',
			message: {
				de: 'Twitch: [emotes] / BetterTTV: KEKW HAhaa ddHuh CouldYouNot WeSmart OMEGALUL POGGERS SnoopPls vibePls HeadBanging Dance catJAM PETTHEMODS 200IQ Loading',
				en: 'Twitch: [emotes] / BetterTTV: KEKW HAhaa ddHuh CouldYouNot WeSmart OMEGALUL POGGERS SnoopPls vibePls HeadBanging Dance catJAM PETTHEMODS 200IQ Loading'
			}
		},
		playlist: {
			description: 'Link zur aktuellen Playlist',
			handler: async (_options: TwitchCommandOptions) => {
				return await Spotify.getCurrentPlaylist();
			}
		},
		reloadcss: {
			handler: () => ''
		},
		rewardsongrequest: {
			handler: async (options: TwitchCommandOptions) => {
				const track = await Spotify.addToQueue(options.param);
				if (track.includes('Error'))
					return track;

				return options.returnMessage.replace('[song]', track);
			},
			message: {
				de: '[song] zur Warteschlange hinzugefügt',
				en: '[song] added to queue'
			}
		},
		skip: {
			description: '2 votes to skip a Song',
			handler: async (_options: TwitchCommandOptions) => {
				return await twitch.spotify.skipToNext();
			}
		},
		song: {
			description: 'Der aktuelle Song',
			handler: async (_options: TwitchCommandOptions) => {
				return await Spotify.getCurrentSong();
			}
		},
		soundboard: {
			handler: () => {
				const sounds: string[] = [];
				for (
					const [index, command] of twitch.commands.commands.entries()
				) {
					if (command.hasSound || command.hasVideo) {
						sounds.push(`!${index}`);
					}
				}
				return `▶️ ${sounds.join(', ')}`;
			},
			aliases: ['sb'],
			description: 'Alle Sounds'
		},
		test: {
			message: {
				de: 'Test bestanden ▶️ Scheint zu funzen 🔥',
				en: 'Test passed ▶️ Seems to work 🔥'
			},
			description: 'Läuft alles?'
		},
		time: {
			handler: (_options: TwitchCommandOptions) => {
				return new Date().toLocaleTimeString('de-DE', {
					timeZone: 'Europe/Berlin'
				});
			}
		},
		translate: {
			aliases: ['t'],
			disableIfOffline: true,
			handler: async (options: TwitchCommandOptions) => {
				return await Deepl.maybeTranslate(options, twitch);
			}
		},
		vod: {
			description: 'Zum aktuellen VOD',
			handler: async (options: TwitchCommandOptions) => {
				return options.returnMessage +
					await Youtube.getVodLink(twitch.stream.isActive);
			},
			message: {
				de: 'Zum aktuellen VOD ▶️ ',
				en: 'To the current VOD ▶️ '
			}
		},
		weather: {
			aliases: ['wetter', 'tempo'],
			disableIfOffline: true,
			handler: async (options: TwitchCommandOptions) => {
				if (!options.param) {
					options.param = 'Florianopolis';
				}

				const weatherData = await OpenWeather.handleWeatherRequest(
					options.param,
					'',
					twitch.stream.language
				);

				if (!weatherData?.temp) {
					return `Nah`;
				}

				return options.returnMessage
					.replace('[cityName]', weatherData.cityName)
					.replace('[countryCode]', weatherData.countryCode)
					.replace('[humidity]', weatherData.humidity)
					.replace('[temp]', weatherData.temp)
					.replace('[feelsLike]', weatherData.feelsLike)
					.replace('[description]', weatherData.description);
			},
			message: {
				de: 'In [cityName] ([countryCode]) ists gerade [temp]° ([feelsLike]°)  ▶️  [description] mit [humidity]% Luftfeuchtigkeit',
				en: 'The temp in [cityName] ([countryCode]) is [temp]° ([feelsLike]°) ▶️ [description] with [humidity]% humidity'
			}
		}
	};
}
