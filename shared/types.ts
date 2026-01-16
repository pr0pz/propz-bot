import type { Buffer } from 'node:buffer';
import type { HelixStream } from '@twurple/api';
import type { RefreshingAuthProvider } from '@twurple/auth';
import type { ChatMessage } from '@twurple/chat';

export interface BotReactionMessage
{
	[key: string]: string | string[];
}

export interface TwitchCommand
{
	aliases?: string[];
	cooldown?: number;
	description?: string;
	disableOnFocus?: boolean;
	disableIfOffline?: boolean;
	discord?: string;
	handler?: ( options: TwitchCommandOptions ) => Promise<string | void> | string | void;
	hasSound?: boolean | string;
	hasVideo?: boolean | string;
	hasImage?: boolean | string;
	message?: string | string[] | BotReactionMessage;
	obs?: ObsData | ObsData[];
	onlyMods?: boolean;
}

export interface TwitchCommandOptions
{
	sender: SimpleUser;
	param: string;
	commandName: string;
	message: string;
	returnMessage: string;
	messageObject: ChatMessage | null;
	stream: HelixStream | null;
}

export interface TwitchEvent
{
	date?: Date;
	isAnnouncement?: boolean;
	message?: BotReactionMessage;
	messageImage?: BotReactionMessage;
	disableOnFocus?: boolean;
	saveEvent?: boolean;
	obs?: ObsData | ObsData[];
	hasSound?: boolean | string;
	hasVideo?: boolean | string;
	hasImage?: boolean | string;
	showAvatar?: boolean;
	isCommand?: boolean;
	extra?: {
		[key: string]: TwitchEventExtra;
	};
	eventText?: {
		[key: string]: string;
	};
	_comment?: string;
}

export interface TwitchEventExtra
{
	titleAlert?: string;
	titleEvent?: string;
}

export interface TwitchTimers
{
	message?: BotReactionMessage;
	isAnnouncement?: boolean;
}

export interface TwitchEventData
{
	type: string;
	user: SimpleUser;
	timestamp: number;
	count?: number;
	extra?: TwitchEventExtra;
}

export interface TwitchEventDataLast
{
	type: string;
	user_id: string;
	name: string;
	timestamp: number;
	count?: number;
	extra?: TwitchEventExtra;
}

export interface TwitchAuthData
{
	authProvider: RefreshingAuthProvider | null;
	initialOauthCode: string;
	userId: string;
	scopes: string[];
}

export interface TwitchQuote
{
	date: string;
	category: string;
	text: string;
	user_id: string;
	vod_url: string;
	name?: string;
}

export interface TwitchQuoteRow extends TwitchQuote
{
	id: string | number;
	[key: string]: any;
}

export interface TwitchJoke
{
	user_id: string;
	text: string;
	name?: string;
}

export interface TwitchJokeRow extends TwitchJoke
{
	id: string | number;
	[key: string]: any;
}

export interface TwitchCounter
{
	key: string;
	value: number;
	created: number;
	updated: number;
}

export interface TwitchCounterRow extends TwitchCounter
{
	[key: string]: string|integer;
}

export interface TwitchReward
{
	id: string;
	title: string;
	cost: number;
	backgroundColor: string;
	prompt: string;
	globalCooldown: number | null;
	maxRedemptionsPerStream: number | null;
	maxRedemptionsPerUserPerStream: number | null;
	userInputRequired: boolean;
	isEnabled: boolean;
	autoFulfill: boolean;
}

export interface TwitchUserData
{
	id: string;
	name: string;
	profile_picture: string;
	color: string;
	follow_date: number;
	message_count: number;
	first_count: number;
	sub_count: number;
	gift_count: number;
	gift_subs: number;
	raid_count: number;
	raid_viewers: number;
	[key: string]: number | string | boolean | null;
}

export interface TwitchBadge
{
	id: string;
	versions: TwitchBadgeVersion[];
}

export interface TwitchBadgeVersion
{
	id: string;
	name: string;
	url: string;
}

export interface TwitchFirstChatter
{
	name: string;
	timestamp: number;
}

export interface UserStreamStats
{
	user_id: string;
	name: string;
	profile_picture: string;
	color: string;
	message: number;
	cheer: number;
	follow: number;
	raid: number;
	first_chatter: number;
	sub: number;
	subgift: number;
}

export interface FrankerFaceZResponse
{
	default_sets?: number[];
	room?: FrankerFaceZRoom;
	sets: Record<string, FrankerFaceZEmoteSet>;
	status?: number;
	error?: string;
}

export interface FrankerFaceZRoom
{
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

export interface FrankerFaceZEmoteSet
{
	id: number;
	_type: number;
	icon: string | null;
	title: string;
	css: string | null;
	emoticons: FrankerFaceZEmoticon[];
}

export interface FrankerFaceZEmoticon
{
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

export interface FrankerFaceZEmoteOwner
{
	_id: number;
	name: string;
	display_name: string;
}

export interface BTTVResponse
{
	id: string;
	bots: string[];
	avatar: string;
	channelEmotes: BTTVEmote[];
	sharedEmotes: BTTVEmote[];
}

export interface BTTVEmote
{
	id: string;
	code: string;
	imageType: string;
	animated: boolean;
	userId?: string;
	modifier?: boolean;
	user?: BTTVUser;
}

export interface BTTVUser
{
	id: string;
	name: string;
	displayName: string;
	providerId: string;
}

export interface SevenTVApiResponse
{
	errors: any;
	data: {
		emoteSets: {
			emoteSets: SevenTVEmoteSet[];
		}
	};
	extensions: any;
}

export interface SevenTVEmoteSet
{
	id: string;
	name: string;
	emotes: {
		items: SevenTVEmote[]
	}
}

export interface SevenTVEmote
{
	alias: string;
	emote: {
		defaultName: string;
		id: string;
	}
}

export interface GithubData
{
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

export interface StreamElementsViewerStats
{
	channel: string;
	username: string;
	points: number;
	pointsAlltime: number;
	watchtime: number;
	rank: number;
}

export interface StreamData
{
	displayName: string;
	profilePictureUrl: string;
	streamUrl: string;
	streamThumbnailUrl: string;
	streamTitle: string;
	streamDescription: string;
	streamAnnouncementMessage: string;
}

export interface StreamDataApi
{
	gameName: string;
	startDate: number;
	thumbnailUrl: string;
	title: string;
	language: string;
}

export interface SimpleUser
{
	id?: string;
	name: string;
	displayName: string;
	color?: string;
	isMod?: boolean;
	isSub?: boolean;
	isVip?: boolean;
	isFollower?: boolean;
	profilePictureUrl?: string;
}

export interface WebSocketData
{
	key: string;
	type: string;
	user: string;
	userId: string;
	isSub: boolean;
	isMod: boolean;
	isVip: boolean;
	isFollower: boolean;
	text: string;
	count: number | null;
	color: string;
	hasSound?: boolean | string;
	hasVideo?: boolean | string;
	hasImage?: boolean | string;
	showAvatar?: boolean;
	badges?: string;
	extra?: TwitchEventExtra | null;
	obs?: ObsData | ObsData[] | null;
	profilePictureUrl?: string;
	saveEvent?: boolean;
}

export interface YoutubeApiResponse
{
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

export interface YoutubeApiError
{
	error: {
		code: number;
		message: string;
		errors: {
			message: string;
			domain: string;
			reason: string;
		}[];
		status: string;
	};
}

interface YoutubeApiItem
{
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

interface YoutubeThumbnail
{
	url: string;
	width: number;
	height: number;
}

export interface ApiRequest
{
	request: string;
	data?: {
		[key: string]: string;
	};
}

export interface ApiResponse
{
	data?: Array<object> | object | boolean | string;
}

export interface ObsData
{
	requestType: string;
	requestData: {
		sceneName?: string;
		sceneUuid?: string;
		sceneItemId?: number;
		sceneItemEnabled?: boolean;
		sourceName?: string;
		sourceUuid?: string;
		filterName?: string;
		filterEnabled?: boolean;
		inputName?: string;
		inputUuid?: string;
		inputMuted?: boolean;
		mediaAction?: string;
		propertyName?: string;
	};
}

export interface KofiData
{
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

interface KofiShopItem
{
	direct_link_code: string;
	variation_name: string;
	quantity: number;
}

export interface Pixel
{
	R: number;
	G: number;
	B: number;
	A: number;
}

export type ImageBuffer = Buffer | Uint8Array;

export type PrintAlertEvents = {
	[key: string]: {
		title: string;
		text?: string;
	};
};

export interface OpenWeatherResponse
{
	coord: {
		lon: number;
		lat: number;
	};
	weather: [
		{
			id: number;
			main: string;
			description: string;
			icon: string;
		}
	];
	base: string;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
		sea_level: number;
		grnd_level: number;
	};
	visibility: number;
	wind: {
		speed: number;
		deg: number;
		gust: number;
	};
	rain?: {
		[key: string]: number;
	};
	clouds: {
		all: number;
	};
	dt: number;
	sys: {
		type: number;
		id: number;
		country: string;
		sunrise: number;
		sunset: number;
	};
	timezone: number;
	id: number;
	name: string;
	cod: number;
	message?: string;
}

export interface WeatherData
{
	cityName: string;
	countryCode: string;
	description: string;
	feelsLike: string;
	humidity: string;
	temp: string;
	icon: string;
	iconUrl: string;
}

export interface SpotifyTokenData
{
	access_token: string;
	token_type: string;
	scope: string;
	expires_in: number;
	expires_at: number;
	refresh_token: string;
	error?: {
		message: string;
		status: number;
	};
}

export interface SpotifyQueueTrack
{
	position?: number;
	userName?: string;
	trackName: string;
	trackId: string;
}

export interface UserChatStyles {
	twitch_user_id: string;
	chat_styles: string;
}

export interface ExternalStreamer {
	id: number;
	name: string;
	message: string;
	discordUid?: string;
}
