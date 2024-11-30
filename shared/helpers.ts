/**
 * Helper functions
 * 
 * @author Wellington Estevo
 * @version 1.0.3
 */

/** Log function + overloads
 * 
 * @param {string|unknown} input Message or unknown error object
 */
export function log( input: string|number|unknown, verbose?: boolean )
{
	if ( typeof input === 'undefined' ) return;
	if ( typeof input === 'number' ) input = input.toString();
	if ( verbose === false ) return;

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