# __Propz Stream Bot 🎉__

[![Made with Deno](https://img.shields.io/static/v1?label&message=Deno&color=70ffaf&logo=deno&logoColor=323330)](https://deno.com/)
![Made with Typescript](https://img.shields.io/static/v1?label&message=Typescript&color=3871c6&logo=typescript&logoColor=fff)
![Made with React](https://img.shields.io/static/v1?label&message=React&color=61dbfb&logo=react&logoColor=323330)
[![Made with Twurple](https://img.shields.io/static/v1?label&message=Twurple&color=647d0f&logo=twitch&logoColor=fff)](https://twurple.js.org/)
[![Made with Discord.js](https://img.shields.io/static/v1?label&message=Discord.js&color=379c6f&logo=discord&logoColor=fff)](https://discord.js.org/)

## __This Bot connects my Twitch Account with Discord, OBS Studio, YouTube etc..__

_Like it? I'd appreciate the support :)_

[![Watch on Twitch](https://img.shields.io/static/v1?label=Watch%20on&message=Twitch&color=bf94ff&logo=twitch&logoColor=fff)](https://propz.de/twitch/)
[![Join on Discord](https://img.shields.io/static/v1?label=Join%20on&message=Discord&color=7289da&logo=discord&logoColor=fff)](https://propz.de/discord/)
[![Donate on Ko-Fi](https://img.shields.io/static/v1?label=Donate%20on&message=Ko-Fi&color=ff5f5f&logo=kofi&logoColor=fff)](https://propz.de/kofi/)

### __Description__


### __Test cases__

- !test: simple text echo
- !uptime: simple text echo when live
- !soundboard: text echo based on config
- !chatscore dmdyy: text from own saved data
- !followage dmdyy: text from own saved data
- !watchtime dmdyy: text from external SE api
- !event channelfollow: test events
- "hola": reaction
- Redeem: change background
- !streamonline: stream announcement on discord when live
- !nuke: sound and video
- !alarm: sound
- !focus: check if focus mode works
- !clear: check if stream hygiene works
- !killswitch + !event: check if killswitch works
- !vod: get last vod link
- !joke: get random joke

### __Instructions for the bot__

- #### 1. Get user ID
	https://streamscharts.com/tools/convert-username

- #### 2. Create a Twitch application
	Go to your Twitch developer console and create a new application. If you don't know what a Redirect URI is, use http://localhost. Write down Client ID and Client Secret somewhere - you're going to need them!

- #### 3. Obtain an access token from Twitch
	Visit this site, with the CLIENT_ID and REDIRECT_URI placeholders replaced with your client ID and redirect URI, respectively:

	```
	https://id.twitch.tv/oauth2/authorize?
		client_id=XXX
		&redirect_uri=BOT_URL
		&response_type=code
		&scope=
			bits:read+
			channel:bot+
			channel:edit:commercial+
			channel:manage:ads+
			channel:manage:broadcast+
			channel:manage:guest_star+
			channel:manage:moderators+
			channel:manage:polls+
			channel:manage:predictions+
			channel:manage:raids+
			channel:manage:redemptions+
			channel:manage:schedule+
			channel:manage:videos+
			channel:manage:vips+
			channel:moderate+
			channel:read:ads+
			channel:read:charity+
			channel:read:editors+
			channel:read:goals+
			channel:read:guest_star+
			channel:read:hype_train+
			channel:read:polls+
			channel:read:predictions+
			channel:read:redemptions+
			channel:read:subscriptions+
			channel:read:vips+
			chat:edit+
			chat:read+
			clips:edit+
			moderation:read+
			moderator:manage:announcements+
			moderator:manage:automod+
			moderator:manage:automod_settings+
			moderator:manage:banned_users+
			moderator:manage:blocked_terms+
			moderator:manage:chat_messages+
			moderator:manage:chat_settings+
			moderator:manage:guest_star+
			moderator:manage:shield_mode+
			moderator:manage:shoutouts+
			moderator:read:automod_settings+
			moderator:read:blocked_terms+
			moderator:read:chatters+
			moderator:read:chat_settings+
			moderator:read:followers+
			moderator:read:guest_star+
			moderator:read:shield_mode+
			moderator:read:shoutouts+
			user:bot+
			user:manage:chat_color+
			user:manage:blocked_users+
			user:manage:whispers+
			user:read:blocked_users+
			user:read:broadcast+
			user:read:chat+
			user:read:email+
			user:read:follows+
			user:read:moderated_channels+
			user:read:subscriptions
	```

	Log in with the account you want to use for your bot and confirm the access to Twitch. You should get redirected to your redirect URI with a query parameter named code.

	put everything in .env


### __Misc Instructions__
- #### Updated Twurple packages order
	deno i @twurple/auth@latest @twurple/api@latest @twurple/chat@latest @twurple/eventsub-ws@latest

- #### pm2 start code
```sh
pm2 start --interpreter="deno" --interpreter-args="run --allow-env --allow-read --allow-write --allow-net --allow-sys --allow-run --unstable-cron --env-file" bot/main.ts --name "propz-bot"
```

_That's it!_

___Be excellent to each other. And, Party on, dudes!___