/**
 * Window
 * 
 * @author Wellington Estevo
 * @version 1.1.3
 */

const Window = ( propz ) =>
{
	return(
		<div className={ 'window window-' + ( propz.theme ?? 'light' ) }>
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