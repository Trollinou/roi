import { render } from '@wordpress/element';
import SuiviApp from './SuiviApp';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'roi-suivi-react-root' );
	if ( container ) {
		render( <SuiviApp />, container );
	}
} );
