<?php
/**
 * Template for shortcode / block rendering of chessboard.
 *
 * @package ROI
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="<?php echo esc_attr( $board_id ); ?>" 
     class="chessboard-block"
     data-fen="<?php echo esc_attr( (string) $atts['fen'] ); ?>"
     data-orientation="<?php echo esc_attr( (string) $atts['orientation'] ); ?>"
     data-coordinates="<?php echo $coordinates ? 'true' : 'false'; ?>"
     data-view-only="<?php echo $view_only ? 'true' : 'false'; ?>"
     data-player-color="<?php echo esc_attr( (string) $atts['playerColor'] ); ?>"
     data-show-threats="<?php echo $show_threats ? 'true' : 'false'; ?>"
     data-use-stockfish="<?php echo $use_stockfish ? 'true' : 'false'; ?>"
     data-free-mode="<?php echo $free_mode ? 'true' : 'false'; ?>">
	<section class="main-wrap">
		<div class="main-board">
			<div class="chessboard-mount-element"></div>
		</div>
	</section>
</div>
