/**
 * Prototype stuff
 *
 * @author Wellington Estevo
 * @version 1.6.0
 */

declare global
{
	interface Object
	{
		isNumeric(): boolean;
	}

	interface String
	{
		toRegExp(): RegExp;
		trim( char?: string ): string;
		isCommand(): boolean;
		sanitize(): string;
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
};

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
	return str.replace( ( '/^[' + char + ']+/i' ).toRegExp(), '' ).replace( ( '/[' + char + ']+$/i' ).toRegExp(), '' );
};

/** Check if object is numeric.
 *
 * No check for dots or commas, so only works with positive int.
 *
 * @param {Object} obj Object to check
 */
Object.prototype.isNumeric = function()
{
	const val = this.valueOf();
	if ( typeof val === 'string' )
		return !isNaN( parseInt( val ) );
	if ( typeof val === 'number' && val > 0 )
		return true;
	return false;
};

/** Check if string is a command.
 *
 * @param {string} str String to check
 */
String.prototype.isCommand = function()
{
	const str = this.valueOf();
	const matches = str.match( /^(@\w+\s)?\!/ig );
	return Boolean( matches?.length && matches.length > 0 );
};

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
};
