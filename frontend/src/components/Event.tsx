const Event = ( propz: { type: string; count: number; title: string; user: string; key: string } ) =>
{
	return(
		<div className={ `event event-${ propz.type }` }>
			<header className="event-header">
				{ propz.count > 1 &&
					<span className="event-count">{ propz.count }x</span>
				}
				{ propz.title &&
					<span className="event-title">{ propz.title }</span>
				}
			</header>
			<div className="event-user">
				{ propz.user }
			</div>
		</div>
	)
}

export default Event;
