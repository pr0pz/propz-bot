/**
 * Types
 * 
 * @author Wellington Estevo
 * @version 1.1.8
 */

import type { Buffer } from 'node:buffer';

export interface BotReactionMessage {
	[key: string]: string|string[];
}

export interface TwitchEventExtra {
	titleAlert?: string;
	titleEvent?: string;
}

export interface TwitchCommand {
	aliases?: string[];
	cooldown?: number;
	description?: string;
	disableOnFocus?: boolean;
	discord?: string;
	handler?: (options: TwitchCommandOptions) => Promise<string | void>|string|void;
	hasSound?: boolean;
	hasVideo?: boolean;
	message?: string|string[]|BotReactionMessage;
	obs?: ObsData|ObsData[];
	onlyMods?: boolean;
}

	export interface TwitchCommandOptions {
		sender: SimpleUser;
		param: string;
		message: string;
		commandMessage: string;
	}

export interface TwitchEvent {
	isAnnouncement?: boolean;
	message?: BotReactionMessage;
	messageImage?: BotReactionMessage;
	disableOnFocus?: boolean;
	saveEvent?: boolean;
	obs?:ObsData|ObsData[];
	hasSound?: boolean;
	hasVideo?: boolean;
	extra?: {
		[key: string]: TwitchEventExtra;
	};
	eventText?: {
		[key: string]: string;
	}
	_comment?: string;
}

	export interface TwitchEvents {
		[key: string]: TwitchEvent;
	}

export interface TwitchReaction {
	trigger: string;
	message: string|string[];
}

export interface TwitchTimers {
	message?: BotReactionMessage;
	isAnnouncement?: boolean;
}

export interface TwitchEventData {
	eventType: string;
	eventUsername: string;
	eventTimestamp: number;
	eventCount?: number;
	extra?: TwitchEventExtra;
}

export interface TwitchQuote {
	date: string;
	category: string;
	quote: string;
	user: string;
	vod: string;
}

export interface TwitchReward {
	id: string;
	title: string;
	cost: number;
	backgroundColor: string;
	prompt: string;
	globalCooldown: number|null;
	maxRedemptionsPerStream: number|null;
	maxRedemptionsPerUserPerStream: number|null;
	userInputRequired: boolean;
	isEnabled: boolean;
	autoFulfill: boolean;
}

export interface TwitchRewards {
	[key: string]: TwitchReward;
}

export interface TwitchUserData {
	name?: string;
	follow?: number;
	messages?: number;
	firsts?: number;
	[key: string]: string|number|undefined;
}

export type TwitchInsightsBot = [string, number, number];

	export interface TwitchInsightsBots {
		bots: TwitchInsightsBot[]
	}

export interface TwitchEmote {
	[key: string]: string;
}

export interface TwitchStreamDate {
	title: string;
	categoryName: string;
	startDate: number;
	endDate: number;
	isRecurring: boolean;
	cancelEndDate: number;
}

export interface TwitchBadge {
	id: string;
	versions:TwitchBadgeVersion[];
}

	export interface TwitchBadgeVersion {
		id: string;
		name: string;
		url: string;
	}

export interface FrankerFaceZResponse {
	default_sets?: number[];
	room?: FrankerFaceZRoom;
	sets: Record<string, FrankerFaceZEmoteSet>;
	status?: number;
	error?: string;
}

	export interface FrankerFaceZRoom {
		_id: number;
		twitch_id: number;
		youtube_id: number | null;
		id: string;
		is_group: boolean;
		display_name: string;
		set: number;
		moderator_badge: string | null;
		vip_badge: string | null;
		mod_urls: Record<string, string> | null;
		user_badges: Record<string, string>;
		user_badge_ids: Record<string, number>;
		css: string | null;
	}

	export interface FrankerFaceZEmoteSet {
		id: number;
		_type: number;
		icon: string | null;
		title: string;
		css: string | null;
		emoticons: FrankerFaceZEmoticon[];
	}

	export interface FrankerFaceZEmoticon {
		id: number;
		name: string;
		height: number;
		width: number;
		public: boolean;
		hidden: boolean;
		modifier: boolean;
		modifier_flags: number;
		offset: number | null;
		margins: string | null;
		css: string | null;
		owner: FrankerFaceZEmoteOwner;
		artist: string | null;
		urls: Record<string, string>;
		status: number;
		usage_count: number;
		created_at: string; // ISO-Datum
		last_updated: string; // ISO-Datum
	}

	export interface FrankerFaceZEmoteOwner {
		_id: number;
		name: string;
		display_name: string;
	}

export interface BTTVResponse {
	id: string;
	bots: string[];
	avatar: string;
	channelEmotes: BTTVEmote[];
	sharedEmotes: BTTVEmote[];
}

	export interface BTTVEmote {
		id: string;
		code: string;
		imageType: string;
		animated: boolean;
		userId?: string;
		modifier?: boolean;
		user?: BTTVUser;
	}

	export interface BTTVUser {
		id: string;
		name: string;
		displayName: string;
		providerId: string;
	}


export interface SevenTVEmoteSet {
	data: {
		emoteSet: {
			id: string;
			name: string;
			emotes: SevenTVEmote[];
		}
	};
	extensions: any;
}

	export interface SevenTVEmote {
		data: {
			id: string;
			name: string;
			host: {
				url: string;
				files: any;
			}
		}
	}

export interface GithubData {
	title: string;
	description: string;
	url: string;
	displayName: string;
	profilePictureUrl: string;
	userUrl: string;
	repoName: string;
	repoFullname: string;
	repoImage: string;
	repoUrl: string;
	repoPrivate: boolean;
}

export interface StreamElementsViewerStats {
	channel: string;
	username: string;
	points: number;
	pointsAlltime: number;
	watchtime: number;
	rank: number;
}

export interface StreamElementsError {
	statusCode: number;
	error: string;
	message: string;
}

export interface StreamData {
	displayName: string;
	profilePictureUrl: string;
	streamUrl: string;
	streamThumbnailUrl: string;
	streamTitle: string;
	streamDescription: string;
	streamAnnouncementMessage: string;
	test: boolean;
}

export interface StreamDataApi {
	gameName: string;
	startDate: number;
	thumbnailUrl: string;
	title: string;
	language: string
}

export interface SimpleUser {
	id?: string;
	name: string;
	displayName: string;
	color?: string,
	isMod?: boolean,
	profilePictureUrl?: string
}

export interface WebSocketData {
	key: string,
	type: string;
	user: string;
	text: string;
	count: number|null;
	color: string;
	hasSound?: boolean;
	hasVideo?: boolean;
	badges?: string;
	extra?: TwitchEventExtra|null;
	obs?: ObsData|ObsData[]|null;
	profilePictureUrl?: string;
}

export interface YoutubeApiResponse {
	kind: string;
	etag: string;
	nextPageToken?: string;
	regionCode: string;
	pageInfo: {
		totalResults: number;
		resultsPerPage: number;
	};
	items: YoutubeApiItem[];
}

	interface YoutubeApiItem {
		kind: string;
		etag: string;
		id: {
			kind: string;
			videoId: string;
		};
		snippet: {
			publishedAt: string;
			channelId: string;
			title: string;
			description: string;
			thumbnails: {
				default: YoutubeThumbnail;
				medium: YoutubeThumbnail;
				high: YoutubeThumbnail;
			};
			channelTitle: string;
			liveBroadcastContent: string;
			publishTime: string;
		};
	}

	interface YoutubeThumbnail {
		url: string;
		width: number;
		height: number;
	}

export interface ApiRequest {
	request: string;
}

export interface ApiResponse {
	data: Array<object>|object|boolean|string;
}

export interface ObsData {
	requestType: string;
	requestData: {
		sceneName?: string;
		sceneUuid?: string;
		sceneItemId?: number,
		sceneItemEnabled?: boolean,
		sourceName?: string;
		sourceUuid?: string;
		filterName?: string;
		filterEnabled?: boolean;
		inputName?: string;
		inputUuid?: string;
		inputMuted?: boolean;
		mediaAction?: string;
		propertyName?: string;
	}
}

export interface KofiData {
	verification_token: string;
	message_id: string;
	timestamp: string;
	type: 'Donation' | 'Subscription' | 'Shop Order';
	is_public: boolean;
	from_name: string;
	message: string | null;
	amount: string;
	url: string;
	email: string;
	currency: string;
	is_subscription_payment: boolean;
	is_first_subscription_payment: boolean;
	kofi_transaction_id: string;
	shop_items?: KofiShopItem[] | null;
	tier_name?: string | null;
	shipping?: unknown;
}

	interface KofiShopItem {
		direct_link_code: string;
		variation_name: string;
		quantity: number;
	}


export interface Pixel {
	R: number;
	G: number;
	B: number;
	A: number;
}

export type ImageBuffer = Buffer|Uint8Array;

export type PrintAlertEvents = {
	[key: string]: {
		title: string;
		text?: string;
	}
}