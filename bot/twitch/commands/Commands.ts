/**
 * Twitch Commands
 *
 * @author Wellington Estevo
 * @version 2.0.13
 */

import { getMessage, log } from '@shared/helpers.ts';
import { UserHelper } from '@twitch/utils/UserHelper.ts';

import soundboardCommands from '@twitch/commands/CommandsSoundboard.ts';
import createFunCommands from '@twitch/commands/CommandsFun.ts';
import createModCommands from '@twitch/commands/CommandsMod.ts';
import createUtilitiesCommands from '@twitch/commands/CommandsUtils.ts';
import createInfoCommands from '@twitch/commands/CommandsInfo.ts';

import type { SimpleUser, TwitchCommand, TwitchCommandOptions } from '@shared/types.ts';
import type { Twitch } from '@twitch/core/Twitch.ts';
import type { ChatMessage } from '@twurple/chat';

export class Commands
{
	private commandHistory: Map<string, number> = new Map();
	public commands: Map<string, TwitchCommand>;

	constructor( private twitch: Twitch )
	{
		// Create commands with twitch context
		this.commands = new Map( Object.entries( {
			...soundboardCommands,
			...createFunCommands(twitch),
			...createModCommands(twitch),
			...createUtilitiesCommands(twitch),
			...createInfoCommands(twitch)
		} ) );
	}

	public get(): Map<string, TwitchCommand> { return this.commands; }

	/** Process chat command
	 *
	 * @param {string} chatMessage Message text
	 * @param {ChatMessage} msg Message object
	 * @param {SimpleUser|null} user
	 */
	public async process( chatMessage: string, msg: ChatMessage | null, user: SimpleUser | null = null )
	{
		const sender = await this.twitch.userHelper.convertToSimplerUser( msg?.userInfo ?? user ?? null );
		if ( !this.validate( chatMessage, sender ) ) return;

		if ( !sender ) return;

		const commandName = this.getFromMessage( chatMessage );
		const command = this.commands.get( commandName )!;

		this.twitch.ws.maybeSendWebsocketData( {
			type: 'command',
			user: sender,
			text: commandName,
			obs: command.obs,
			hasSound: command.hasSound,
			hasVideo: command.hasVideo
		} );

		let message = getMessage( command.message, this.twitch.stream.language );

		if ( command.handler )
		{
			const chatMessageSplitted = chatMessage.trim().split( ' ' );
			const options: TwitchCommandOptions = {
				sender: sender,
				param: chatMessageSplitted[1] || '',
				message: chatMessage.replaceAll( /^(?:@\w+\s)?!\w+/gi, '' ).trim(),
				returnMessage: message,
				messageObject: msg,
				stream: this.twitch.stream
			};

			message = await command.handler( options ) || '';
		}

		if ( message )
			void this.twitch.chat.sendAction( message );
	}

	/** Check if commands can be executed */
	public validate( chatMessage: string, user: SimpleUser|null ): boolean
	{
		if ( !chatMessage || !user ) return false;

		const commandName = this.getFromMessage( chatMessage );
		const command = this.commands.get( commandName );

		// No data for this command
		if ( !command ) return false;

		// Focus Mode
		if ( this.twitch.focus.timer && command.disableOnFocus )
			return false;

		// Disable if Stream is offline
		if ( !this.twitch.stream.isActive && command.disableIfOffline )
			return false;

		// Check for mod properties
		if (
			command.onlyMods &&
			!user.isMod &&
			user.name.toLowerCase() !==  UserHelper.broadcasterName.toLowerCase()
		) return false;

		if ( this.isInCooldown( commandName ) )
			return false;

		return true;
	}

	/** Extracts the command name form chat message */
	private getFromMessage( chatMessage: string ): string
	{
		if ( !chatMessage ) return '';

		const [ ...matches ] = chatMessage.matchAll( /^(?:@\w+\s)?!(\w+)/ig );
		const commandName = matches?.[0]?.[1] ?? '';

		for ( const [ cmdName, cmd ] of this.commands.entries() )
		{
			if ( cmd.aliases?.includes( commandName.toLowerCase() ) )
				return cmdName;
		}

		return commandName;
	}

	/** Check if command is in cooldown */
	private isInCooldown( commandName: string ): boolean
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
			) return true;

			this.commandHistory.delete( commandName );
		}

		this.commandHistory.set( commandName, timestamp );
		return false;
	}

	/**
	 * Reload all commands
	 *
	 * @returns {Promise<void>}
	 */
	public async reload(): Promise<void>
	{
		try
		{
			const soundboardCommandsModule = await import(
				`@twitch/commands/CommandsSoundboard.ts?cache-bust=${ Date.now() }`
			);
			const createFunCommandsModule = await import(
				`@twitch/commands/CommandsFun.ts?cache-bust=${ Date.now() }`
			);
			const createModCommandsModule = await import(
				`@twitch/commands/CommandsMod.ts?cache-bust=${ Date.now() }`
			);
			const createUtilitiesCommandsModule = await import(
				`@twitch/commands/CommandsUtils.ts?cache-bust=${ Date.now() }`
			);
			const createInfoCommandsModule = await import(
				`@twitch/commands/CommandsInfo.ts?cache-bust=${ Date.now() }`
			);

			this.commands = new Map( Object.entries( {
				...soundboardCommandsModule.default(),
				...createFunCommandsModule.default( this.twitch ),
				...createModCommandsModule.default( this.twitch ),
				...createUtilitiesCommandsModule.default( this.twitch ),
				...createInfoCommandsModule.default( this.twitch )
			} ) );

			log( 'Commands reloaded ♻️' );
		}
		catch ( error: unknown ) {log( error ) }
	}
}
