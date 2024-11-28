/**
 * Util functions
 * 
 * @author Wellington Estevo
 * @version 1.0.0
 */

declare global {
	interface Object {
		isNumeric(): boolean
	}

	interface String {
		toRegExp(): RegExp,
		trim( char?: string ): string,
		isCommand(): boolean,
		sanitize(): string
	}
}

/** Convert string to RegExp object.
 * 
 * https://stackoverflow.com/a/55258958/4371770
 *
 * @param {string} str String to convert to RegExp.
 */
String.prototype.toRegExp = function()
{
	const str = this.valueOf();
	if ( str.includes( '/' ) )
	{
		const mainMatch = str.match( /\/(.+)\/.*/ );
		const optionsMatch = str.match( /\/.+\/(.*)/ );

		const main = mainMatch?.[1] ? mainMatch[1] : '';
		const options = optionsMatch?.[1] ? optionsMatch[1] : '';

		return new RegExp( main, options );
	}
	else
	{
		return new RegExp( str, 'gi' );
	}
}

/** Trim Characters from a String.
 * 
 * https://masteringjs.io/tutorials/fundamentals/trim
 *
 * @param {string} char Character to trim, defaults to whitespace
 * @param {string} str String to trim
 */
String.prototype.trim = function( char: string = ' ' )
{
	const str = this.valueOf();
	return str.replace( ('/^[' + char + ']+/i').toRegExp(), '' ).replace( ('/[' + char +']+$/i').toRegExp(), '' );
}

/** Check if object is numeric.
 * 
 * No check for dots or commas, so only works with positive int.
 *
 * @param {Object} obj Object to check
 */
Object.prototype.isNumeric = function()
{
	const val = this.valueOf();
	if ( typeof val === 'string' ) return !isNaN( parseInt( val ) );
	if ( typeof val === 'number' && val > 0 ) return true;
	return false;
}

/** Check if string is a command.
 *
 * @param {string} str String to check
 */
String.prototype.isCommand = function()
{
	const str = this.valueOf();
	return str.startsWith( '!' );
}

/** Sanitize string
 * 
 * https://www.w3docs.com/snippets/javascript/how-to-html-encode-a-string.html
 *
 * @param {string} str String to check.
 */
String.prototype.sanitize = function()
{
	const str = this.valueOf();
	return str
		.replace( /&/g, '&amp;' )
		.replace( /'/g, '&apos' )
		.replace( /"/g, '&quot' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

/** Log function + overloads
 * 
 * @param {string|unknown} input Message or unknown error object
 */
export function log( input: string|number|unknown )
{
	if ( typeof input === 'undefined' ) return;
	if ( typeof input === 'number' ) input = input.toString();

	// Get stack trace for caller information
	const stackLines = new Error().stack?.split('\n');
	//console.table( stackLines );
	const callerLine = stackLines?.[2] ? stackLines[2] : 'caller';

	// Parse function and file from stack trace
	const match = callerLine.match(/at\s+(?:\w+\.)?<?([\w]+)>?\s+\(.+\/([\w.]+)\.[\w]+:(\d+):(\d+)\)/) || callerLine.match(/at .+\/([\w.]+)\.[\w]+:(\d+):(\d+)/);
	const file = match ? match[2] : 'file';
	const line = match ? ':' + match[3] : '';
	const fn = match?.[1] && match[1] !== 'anonymous' ? ' ' + match[1] : '';
	
	let message: string = `<${file.replace('.class', '')}${line}>${fn}`;
	if ( typeof input === 'string' )
	{
		console.log( message + ` › ${input}` );
		return;
	}
	else if ( input instanceof Error )
	{
		message += ` › ${input.message}`;
	}
	else if ( typeof input === 'object' && input !== null && 'message' in input )
	{
		message += ` › ${(input as { message: string }).message}`;
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
	const mdiv = ( dividend: number, divisor: number ) => {
		return [ Math.floor( dividend/divisor ), dividend % divisor ];
	}

	const [yy, yr] = mdiv( date_diff, 3.154e10 );
	const [mm, mr] = mdiv( yr, 2.628e9 );
	const [dd, dr] = mdiv( mr, 8.64e7 );
	const [hh, hr] = mdiv( dr, 3.6e6 );
	const [tt, _ss] = mdiv( hr, 6e4 );

	const ymdht: string[] = ['year', 'month', 'day', 'hour', 'minute'];
	const timeSince: string[] = [];
	[yy, mm, dd, hh, tt].forEach( ( time: number, index: number ) =>
	{
		if ( timeSince.length === max_units ) return;
		if ( time !== 0 )
			timeSince.push( time === 1 ? `${ time } ${ ymdht[index] }` : `${ time } ${ ymdht[index] }s`);
	});
	return timeSince.length === 0 ? '' : timeSince.join(' › ');
}

/** Get random message
 * 
 * @param {string|string[]} message Var containing message(s).
 */
export function getMessage( msg: string|string[]|object|undefined|null, language: string = 'de' )
{
	if ( !msg ) return '';

	if ( language && typeof msg === 'object' && language in msg )
		msg = msg[ language as keyof typeof msg ];
	
	// Return if just one simple message
	if ( !Array.isArray( msg ) && msg )
		return msg;

	// Get random message
	if ( msg.length > 0 )
	{
		const randomIndex = getRandomNumber( msg.length );
		return msg[ randomIndex ];
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
	// We allow style + audio for fun
	if ( message.match( /<(iframe|video|embed|track|script|link|applet|meta|xmp|noscript|comment|object|plaintext|listing)|dangerouslySetInnerHTML|setHTMLUnsafe/gi ) )
		message = message.sanitize();

	return message;
}

/** Sleep for x seconds
 * 
 * @param {number} seconds Seconds to sleep
 */
export async function sleep( seconds: number )
{
	if ( !seconds ) return;
	return await new Promise( function (resolve, _msgreject) {
		setTimeout( function () {
			resolve( 1 );
		}, seconds * 1000 );
	});
}

/** Get Reward slug
 * 
 * @param {string} rewardName Original Reward Name
 */
export function getRewardSlug( rewardName: string )
{
	if ( !rewardName ) return '';
	return 'reward' + rewardName.trim().replace( /[\W]+/gi, '' ).toLowerCase();
}