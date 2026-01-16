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

	interface Date
	{
		timestamp(): number;
	}

	interface DateConstructor
	{
		timestamp(): number;
	}
}

/** Convert string to RegExp object.
 *
 * https://stackoverflow.com/a/55258958/4371770
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
 */
String.prototype.trim = function( char: string = ' ' )
{
	const str = this.valueOf();
	return str.replace( ( '/^[' + char + ']+/i' ).toRegExp(), '' ).replace( ( '/[' + char + ']+$/i' ).toRegExp(), '' );
};

/** Check if object is numeric.
 *
 * No check for dots or commas, so only works with positive int.
 */
Object.prototype.isNumeric = function()
{
	const val = this.valueOf();
	if ( typeof val === 'string' )
		return !isNaN( parseInt( val ) );
	return typeof val === 'number' && val > 0;
};

/** Check if string is a command. */
String.prototype.isCommand = function()
{
	const str = this.valueOf();
	const matches = str.match( /^(@\w+\s)?!/ig );
	return Boolean( matches?.length && matches.length > 0 );
};

/** Sanitize string
 *
 * https://www.w3docs.com/snippets/javascript/how-to-html-encode-a-string.html
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

/** Get current timestamp */
Date.prototype.timestamp = function(): number
{
	return Math.floor( Date.now() / 1000 );
};

/** Get current timestamp (static) */
Date.timestamp = function(): number
{
	return Math.floor( Date.now() / 1000 );
};
