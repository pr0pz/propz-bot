/**
 * Helper functions
 *
 * @author Wellington Estevo
 * @version 1.6.5
 */

import type { TwitchTimers, TwitchUserData } from '@propz/types.ts';

/** Log function + overloads
 *
 * @param {string|number|unknown} input Message or unknown error object
 * @param {boolean} isWarning If it's a warning
 * @param {boolean} verbose If message should be logged
 */
export function log(
	input: string | number | unknown,
	isWarning: boolean = false,
	verbose?: boolean
)
{
	if ( verbose === false ) return;
	if ( typeof input === 'undefined' ) return;
	if ( typeof input === 'number' ) input = input.toString();

	// Get stack trace for caller information
	const stackLines = new Error().stack?.split( '\n' );
	// console.table( stackLines );
	const callerLine = stackLines?.[2] ? stackLines[2] : 'caller';

	// Parse function and file from stack trace
	const match = callerLine.match(
		/at\s+(?:\w+\.)?<?(\w+)>?\s+\(.+\/([\w.]+)\.\w+:(\d+):(\d+)\)/
	) || callerLine.match( /at .+\/([\w.]+)\.\w+:(\d+):(\d+)/ );
	const file = match ? match[2] : 'file';
	const line = match ? ':' + match[3] : '';
	const fn = match?.[1] && match[1] !== 'anonymous' ? ' ' + match[1] : '';
	const icon = isWarning ? '🟡' : '❌';
	const date = new Date().toLocaleDateString( 'de-DE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	} );

	let message: string = `${date} <${file.replace( '.class', '' )}${line}>${fn}`;
	if ( isWarning )
	{
		console.warn( message + ` ${icon} ${input}` );
		return;
	}
	else if ( typeof input === 'string' )
	{
		console.log( message + ` › ${input}` );
		return;
	}
	else if ( input instanceof Error )
	{
		message += ` ${icon} ${input.message}`;
	}
	else if (
		typeof input === 'object' && input !== null && 'message' in input
	)
	{
		message += ` › ${( input as { message: string; } ).message}`;
	}
	else
	{
		message += ' › unknown error';
	}
	console.error( message );
}

/** Get random number between min and max
 *
 * @param {number} max Max number
 * @param {number} min Min number
 */
export function getRandomNumber( max: number = 1, min: number = 0 )
{
	if ( isNaN( max ) || isNaN( min ) ) return 0;
	return Math.floor( Math.random() * ( max - min ) ) + min;
}

/** Get time since date.
 *
 * 1. Pass in milliseconds
 * 2. if max_units is two, result will be e.g.: 2 years 12 months / 2 hours 38 minutes
 *
 * @param {number} date_diff Date in milliseconds
 * @param {number} max_units Max number of units to show
 */
export function getTimePassed( date_diff: number, max_units: number = 2 )
{
	if ( !date_diff || !max_units ) return '';
	const mdiv = ( dividend: number, divisor: number ) =>
	{
		return [ Math.floor( dividend / divisor ), dividend % divisor ];
	};

	const [ yy, yr ] = mdiv( date_diff, 3.154e10 );
	const [ mm, mr ] = mdiv( yr, 2.628e9 );
	const [ dd, dr ] = mdiv( mr, 8.64e7 );
	const [ hh, hr ] = mdiv( dr, 3.6e6 );
	const [ tt, _ss ] = mdiv( hr, 6e4 );

	const ymdht: string[] = [ 'year', 'month', 'day', 'hour', 'minute' ];
	const timeSince: string[] = [];
	[ yy, mm, dd, hh, tt ].forEach( ( time: number, index: number ) =>
	{
		if ( timeSince.length === max_units ) return;
		if ( time !== 0 )
		{
			timeSince.push(
				time === 1 ? `${time} ${ymdht[index]}` : `${time} ${ymdht[index]}s`
			);
		}
	} );
	return timeSince.length === 0 ? '' : timeSince.join( ' › ' );
}

/** Get random message
 *
 * @param msg
 * @param language
 */
export function getMessage(
	msg: string | string[] | object | undefined | null,
	language: string = 'de'
)
{
	if ( !msg ) return '';

	if ( language && typeof msg === 'object' && language in msg )
	{
		msg = msg[language as keyof typeof msg];
	}

	// Return if just one simple message
	if ( !Array.isArray( msg ) && msg )
	{
		return msg;
	}

	// Get random message
	if ( msg.length > 0 )
	{
		const randomIndex = getRandomNumber( msg.length );
		return msg[randomIndex];
	}
	return '';
}

/** Sanitize chat message
 *
 * @param {string} message Message to sanitize
 */
export function sanitizeMessage( message: string = '' )
{
	if ( !message ) return '';
	// Only sanitize if message has some unsecure html tags
	if (
		message.match(
			/<(iframe|video|audio|img|embed|track|source|script|link|applet|meta|xmp|noscript|body|comment|object|plaintext|listing|style)|dangerouslySetInnerHTML|setHTMLUnsafe|url\(|src=/gi
		)
	)
	{
		message = message.sanitize();
	}

	return message;
}

/** Sleep/Wait for x seconds
 *
 * @param ms
 */
export function sleep( ms: number = 500 )
{
	ms = ms || 500;
	return new Promise( ( res ) => setTimeout( res, ms ) );
}

/** Get Reward slug
 *
 * @param {string} rewardName Original Reward Name
 */
export function getRewardSlug( rewardName: string )
{
	if ( !rewardName ) return '';
	return 'reward' + rewardName.trim().replace( /\W+/gi, '' ).toLowerCase();
}

/** Exec cli command
 *
 * @param {string} command
 * @param {string} args
 */
export function execCommand( command: string, args: string | string[] )
{
	args = !Array.isArray( args ) ? [ args ] : args;
	const cmd = new Deno.Command( command, {
		args: args
	} );

	try
	{
		const { stdout, stderr } = cmd.outputSync();
		const err = new TextDecoder().decode( stderr ).trim();
		const output = new TextDecoder().decode( stdout ).trim();
		return err || output;
	}
	catch ( error: unknown )
	{
		log( error );
		if ( error instanceof Error )
		{
			return error.message;
		}

		return '';
	}
}

/** Convert object with key and values to a map */
export function objectToMap( data: object )
{
	return new Map( Object.entries( data ).map( ( [ key, value ] ) => [ key, value ] ) );
}

/** Convert map to object with key and values */
export function mapToObject( data: Map<string, any> )
{
	const obj: { [key: string]: any; } = {};
	for ( const [ key, value ] of data.entries() )
	{
		// Handle nested maps recursively
		if ( value instanceof Map )
		{
			obj[key] = toObject( value );
		}
		// Handle nested objects that might contain maps
		else if ( typeof value === 'object' && value !== null )
		{
			obj[key] = Object.entries( value ).reduce( ( acc: any, [ k, v ] ) =>
			{
				acc[k] = v instanceof Map ? toObject( v ) : v;
				return acc;
			}, {} );
		}
		// Handle primitive values
		else
		{
			obj[key] = value;
		}
	}
	return obj;
}

/** Convert Map to object with key and values */
export function toObject(
	data: Map<string, string | TwitchTimers | TwitchUserData>
)
{
	return Object.fromEntries( data );
}
