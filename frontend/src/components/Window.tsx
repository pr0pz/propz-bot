/**
 * Window
 * 
 * @author Wellington Estevo
 * @version 1.1.4
 */

const Window = ( propz: { id?: string, theme?: string, color?: string, children: React.ReactNode } ) =>
{
	return(
		<div id={ propz.id || 'window' } className={ 'window window-' + ( propz.theme ?? 'light' ) }>
			<div className="window-header">
				<span className="window-button red"></span>
				<span className="window-button yellow"></span>
				<span className="window-button green"></span>
			</div>

			<div className="window-body" style={ ( propz.color ? { color: propz.color } : {} )
			}>
				{ propz.children }
			</div>
		</div>
	);
}

export default Window;