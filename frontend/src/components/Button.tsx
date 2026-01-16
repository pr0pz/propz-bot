const Button = ( propz: { id?: string, theme?: string, style?: React.CSSProperties, children: React.ReactNode } ) =>
{
	return(
		<div id={ propz.id || 'button' } className={ 'radius border shadow button button-' + ( propz.theme ?? 'light' ) } style={ propz.style ?? {} }>
			{ propz.children }
		</div>
	);
}

export default Button;
