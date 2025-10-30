/**
 * Killswitch
 *
 * @author Wellington Estevo
 * @version 2.0.0
 */

import { log } from '@shared/helpers.ts';

export class Killswitch
{
	constructor( public status: boolean = false ) {}

	/** Set killswitch status */
	public set( killswitchStatus: boolean ): void
	{
		if ( typeof killswitchStatus !== 'boolean' ) return;
		this.status = Boolean( killswitchStatus );
		log( `Killswitch ${this.status ? 'Activated' : 'Deactivated'}` );
	}

	/** Toggle Killswitch status */
	public toggle( killswitchStatus?: boolean ): void
	{
		this.status = typeof killswitchStatus !== 'undefined' ?
			Boolean( killswitchStatus ) :
			!this.status;

		log( `Killswitch ${this.status ? 'Activated' : 'Deactivated'}` );
	}
}
