import { log } from '@shared/helpers.ts';
import { Database } from '@services/Database.ts';
import { Giveaway } from '@modules/features/Giveaway.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import type { TwitchCommand, TwitchCommandOptions } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';

export default function createModCommands(twitch: Twitch): Record<string, TwitchCommand> {
	return {
		ad: {
			handler: (_options: TwitchCommandOptions) => {
				try {
					twitch.twitchApi.channels.startChannelCommercial(
						UserHelper.broadcasterId,
						180
					);
				} catch (error: unknown) {
					log(error);
				}
			},
			aliases: ['adbreak', 'werbung'],
			disableIfOffline: true,
			onlyMods: true
		},
		ban: {
			cooldown: 120,
			handler: (options: TwitchCommandOptions) => {
				void twitch.events.eventProcessor.process({
					eventType: 'ban',
					user: options.param,
					isTest: true
				});
			},
			disableOnFocus: true
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
		clear: {
			message: 'Stream interface cleared',
			onlyMods: true
		},
		clearstats: {
			handler: (_options: TwitchCommandOptions) =>
			{
				const db = Database.getInstance();
				db.execute(`DELETE FROM stream_stats;`);
				return 'Deleted current Stream stats';
			},
			onlyMods: true
		},
		ende: {
			aliases: ['end'],
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
		event: {
			handler: (options: TwitchCommandOptions) => {
				twitch.events.eventProcessor.sendTest(options.message);
			},
			onlyMods: true
		},
		fokus: {
			handler: (options: TwitchCommandOptions) => {
				const focusTimer = twitch.focus.handle(
					parseInt(options.param || '10')
				);
				if (!focusTimer) return;
				return options.returnMessage?.replace('[count]', focusTimer.toString());
			},
			aliases: ['focus'],
			message: {
				de: 'Fokus-Modus für [count]M gestartet',
				en: 'Focus mode activated for [count]M'
			},
			onlyMods: true
		},
		killswitch: {
			handler: (options: TwitchCommandOptions) => {
				twitch.killswitch.toggle();
				return options.returnMessage?.replace(
					'[text]',
					twitch.killswitch.status ? 'Activated' : 'Deactivated'
				);
			},
			message: {
				de: 'Killswitch [text]',
				en: 'Killswitch [text]'
			},
			onlyMods: true
		},
		mark: {
			aliases: ['marker'],
			disableIfOffline: true,
			handler: async (options: TwitchCommandOptions) => {
				try {
					await twitch.twitchApi.streams.createStreamMarker(
						UserHelper.broadcasterId,
						options.message || 'Marker'
					);
					return `Marker created`;
				} catch (error: unknown) {
					log(error);
					return 'Failed to create marker';
				}
			},
			onlyMods: true
		},
		raid: {
			disableIfOffline: true,
			handler: async (options: TwitchCommandOptions) => {
				try {
					const target = await twitch.userHelper.getUser(options.param);
					if (!target) return;

					const raid = await twitch.twitchApi.raids.startRaid(
						UserHelper.broadcasterId,
						target.id
					);
					if (!raid) return;

					void twitch.events.eventProcessor.process({
						eventType: 'startraid',
						user: target
					});
				} catch (error: unknown) {
					log(error);
				}
			},
			onlyMods: true
		},
		reload: {
			handler: async () => {
				await twitch.commands.reload();
				await twitch.rewards.init();
				twitch.streamEvents.reload();
				return 'Reloaded';
			},
			onlyMods: true
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
		scene: {
			aliases: ['szene'],
			handler: (options: TwitchCommandOptions) => {
				if (
					!options?.message ||
					!options.sender
				) {
					return '';
				}

				let sceneName = options.message;
				if (options.message.toLowerCase().includes('desktop')) {
					sceneName = '[S] DESKTOP';
				} else if (options.message.toLowerCase().includes('chat')) {
					sceneName = '[S] CHATTING';
				} else if (options.message.toLowerCase().includes('pause')) {
					sceneName = '[S] PAUSE';
				} else if (options.message.toLowerCase().includes('ende')) {
					sceneName = '[S] ENDE';
				}

				twitch.ws.maybeSendWebsocketData({
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
				});

				return options.returnMessage.replace('[sceneName]', sceneName);
			},
			message: 'Scene changed: [sceneName]',
			onlyMods: true
		},
		setgame: {
			handler: async (options: TwitchCommandOptions) => {
				try {
					let game;
					const param = options.param.toLowerCase();
					if (param.includes('software')) {
						game = await twitch.twitchApi.games.getGameByName(
							'Software and Game Development'
						);
					} else if (param.includes('chat')) {
						game = await twitch.twitchApi.games.getGameByName(
							'Just Chatting'
						);
					} else {
						game = await twitch.twitchApi.games.getGameByName(
							options.param
						);
					}

					if (!game) {
						return `Game not found`;
					}

					await twitch.twitchApi.channels.updateChannelInfo(
						UserHelper.broadcasterId,
						{
							gameId: game.id
						}
					);
					return options.returnMessage.replace('[game]', game.name);
				} catch (error: unknown) {
					log(error);
				}
			},
			aliases: ['game', 'setcat', 'setcategory', 'cat'],
			message: 'Stream Game set to \'[game]\'',
			onlyMods: true
		},
		setlanguage: {
			aliases: ['setlang', 'lang', 'language'],
			handler: async (options: TwitchCommandOptions) => {
				try {
					await twitch.twitchApi.channels.updateChannelInfo(
						UserHelper.broadcasterId,
						{
							language: options.message
						}
					);
					return options.returnMessage.replace('[language]', options.message);
				} catch (error: unknown) {
					log(error);
				}
			},
			onlyMods: true,
			message: 'Stream Language set to \'[language]\''
		},
		settitle: {
			handler: async (options: TwitchCommandOptions) => {
				try {
					await twitch.twitchApi.channels.updateChannelInfo(
						UserHelper.broadcasterId,
						{
							title: options.message
						}
					);
					return options.returnMessage.replace('[title]', options.message);
				} catch (error: unknown) {
					log(error);
				}
			},
			aliases: ['title', 'setstreamtitle'],
			message: 'Stream Title set to \'[title]\'',
			onlyMods: true
		},
		so: {
			handler: (options: TwitchCommandOptions) => {
				void twitch.chat.sendShoutout(options.param);
			},
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
			handler: () => {
				Giveaway.start();
				return 'Giveaway raffle just started!';
			},
			onlyMods: true
		},
		streamonline: {
			handler: () => {
				void twitch.stream.sendStreamOnlineDataToDiscord();
			},
			onlyMods: true
		},
		streamstart: {
			aliases: ['startstream'],
			message: 'Starting stream ...',
			obs: [
				{
					requestType: 'StartStream',
					requestData: {}
				}
			],
			onlyMods: true
		},
		streamstop: {
			aliases: ['stopstream', 'endstream', 'streamend'],
			message: 'Stopping Stream ...',
			obs: [
				{
					requestType: 'StopStream',
					requestData: {}
				}
			],
			onlyMods: true
		},
		tts: {
			handler( options: TwitchCommandOptions )
			{
				twitch.events.eventProcessor.process( {
					eventType: 'rewardtts',
					eventText: options.message,
					user: options.sender
				} );
			},
			onlyMods: true
		},
		win: {
			handler: (options: TwitchCommandOptions) => {
				const winnerCount = options.param ? parseInt(options.param) : 1;
				const winners = Giveaway.pickWinners(winnerCount);
				if (!winners) return 'Something went wrong, ask the shitty coder!';

				return options.returnMessage.replace(
					'[user]',
					winners.map(user => user[1]).join(', @')
				);
			},
			message: {
				de: 'Herzlichen Glückwunsch an @[user] - DU HAST GEWONNEN 🎉🎉🎉',
				en: 'Congratulations to @[user] - YOU WON 🎉🎉🎉'
			},
			onlyMods: true
		}
	};
}
