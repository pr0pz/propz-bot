/**
 * Killswitch
 *
 * @author Wellington Estevo
 * @version 1.10.4
 */

import { log } from '@propz/helpers.ts';

export class Killswitch
{
	constructor( public status: boolean = false ) {}

	/** Set killswitch status */
	public set( killswitchStatus: boolean )
	{
		if ( typeof killswitchStatus !== 'boolean' ) return;
		this.status = Boolean( killswitchStatus );
		log( `Killswitch ${this.status ? 'Activated' : 'Deactivated'}` );
	}

	/** Toggle Killswitch status */
	public toggle( killswitchStatus?: boolean )
	{
		this.status = typeof killswitchStatus !== 'undefined' ?
			Boolean( killswitchStatus ) :
			!this.status;

		log( `Killswitch ${this.status ? 'Activated' : 'Deactivated'}` );
	}
}
