import type { TwitchCommand } from '@shared/types.ts';

const commandsSoundboard: Record<string, TwitchCommand> = {
	aimeme: {
		cooldown: 60,
		disableOnFocus: true,
		hasVideo: true
	},
	airhorn: {
		aliases: ['horn'],
		hasSound: true,
		onlyMods: true
	},
	alarm: {
		cooldown: 10,
		hasSound: true,
		disableOnFocus: true
	},
	applaus: {
		aliases: ['applause'],
		cooldown: 10,
		hasSound: true,
		disableOnFocus: true
	},
	believe: {
		cooldown: 20,
		hasSound: true,
		disableOnFocus: true
	},
	bruh: {
		cooldown: 10,
		hasSound: true,
		disableOnFocus: true
	},
	buh: {
		aliases: ['booh'],
		hasSound: true,
		onlyMods: true
	},
	calmdown: {
		cooldown: 20,
		hasSound: true,
		disableOnFocus: true
	},
	chat: {
		aliases: ['icq'],
		description: 'Ein Zeichen, dass propz den Chat durchlesen soll',
		hasSound: 'icq',
		disableOnFocus: true
	},
	christmas: {
		cooldown: 30,
		aliases: ['xmas'],
		hasSound: true,
		hasVideo: true,
		disableOnFocus: true
	},
	delphin: {
		aliases: ['delfin', 'dolphin', 'golfinho'],
		hasSound: true,
		disableOnFocus: true
	},
	drumroll: {
		cooldown: 60,
		disableOnFocus: true,
		hasSound: true
	},
	emotional: {
		cooldown: 20,
		hasSound: true,
		disableOnFocus: true
	},
	error: {
		cooldown: 30,
		aliases: ['fehler'],
		hasVideo: true
	},
	falsch: {
		cooldown: 10,
		hasSound: true,
		disableOnFocus: true
	},
	garnix: {
		cooldown: 20,
		aliases: ['ganiks'],
		hasSound: true,
		disableOnFocus: true
	},
	hallelujah: {
		aliases: ['halleluja', 'aleluia'],
		hasSound: true,
		hasVideo: true,
		onlyMods: true
	},
	haha: {
		hasSound: 'lachen',
		onlyMods: true
	},
	internet: {
		aliases: ['internetz', 'dial'],
		disableOnFocus: true,
		hasSound: true
	},
	jenny: {
		cooldown: 30,
		hasSound: true,
		disableOnFocus: true
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
	ko: {
		cooldown: 60,
		hasVideo: true,
	},
	letsgo: {
		aliases: ['okletsgo'],
		cooldown: 10,
		hasSound: true,
		disableOnFocus: true
	},
	money: {
		hasVideo: true,
		disableOnFocus: true
	},
	nice: {
		cooldown: 120,
		hasSound: true,
		disableOnFocus: true
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
	pun: {
		cooldown: 20,
		disableOnFocus: true,
		hasSound: true
	},
	snow: {
		hasVideo: true,
		cooldown: 30
	},
	thinking: {
		aliases: ['think', 'denken', 'denk', 'nachdenk', 'nachdenken'],
		hasVideo: true
	},
	tnt: {
		hasVideo: true
	},
	uwu: {
		cooldown: 30,
		hasVideo: true,
		disableOnFocus: true
	},
	wild: {
		cooldown: 20,
		disableOnFocus: true,
		hasSound: true
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
		aliases: ['yeahboi', 'yeahboy'],
		hasSound: true,
		disableOnFocus: true
	}
};
export default commandsSoundboard;
