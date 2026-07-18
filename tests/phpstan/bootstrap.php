<?php
/**
 * Bootstrap file for PHPStan.
 *
 * @package ROI
 */

namespace {
	define( 'ROI_VERSION', '1.2.0' );
	define( 'ROI_PLUGIN_DIR', dirname( __DIR__, 2 ) . '/' );
}

namespace ROI\Shortcodes {
	class Shortcodes {
		public static function chess_pieces_filter( string $content ): string {
			return $content;
		}
	}
}
