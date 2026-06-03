<?php
/**
 * Template pour l'affichage de l'échiquier (Gutenberg Chessboard / Chessground)
 */

if (!defined('ABSPATH')) {
    exit;
}

$show_bar = $use_stockfish && $show_evaluation_bar;
$wrapper_class = 'gutemberg-chessboard-block';
if ($show_bar) {
    $wrapper_class .= ' has-evaluation-bar';
}
?>

<div id="<?php echo esc_attr($board_id); ?>" 
     class="<?php echo esc_attr($wrapper_class); ?>"
     data-fen="<?php echo esc_attr($atts['fen']); ?>"
     data-orientation="<?php echo esc_attr($atts['orientation']); ?>"
     data-coordinates="<?php echo $coordinates ? 'true' : 'false'; ?>"
     data-view-only="<?php echo $view_only ? 'true' : 'false'; ?>"
     data-player-color="<?php echo esc_attr($atts['playerColor']); ?>"
     data-show-threats="<?php echo $show_threats ? 'true' : 'false'; ?>"
     data-use-stockfish="<?php echo $use_stockfish ? 'true' : 'false'; ?>"
     data-stockfish-elo="<?php echo esc_attr($atts['stockfishElo']); ?>"
     data-show-evaluation-bar="<?php echo $show_evaluation_bar ? 'true' : 'false'; ?>"
     data-free-mode="<?php echo $free_mode ? 'true' : 'false'; ?>">

    <section class="main-wrap <?php echo $show_bar ? 'has-evaluation-bar' : ''; ?>">
        <div class="main-board">
            <div class="chessboard-mount-element"></div>
            <?php if ($show_bar): ?>
                <div class="evaluation-bar">
                    <div class="evaluation-bar-fill"
                         style="margin-top: <?php echo $atts['orientation'] === 'white' ? 'auto' : '0'; ?>; margin-bottom: <?php echo $atts['orientation'] === 'white' ? '0' : 'auto'; ?>;">
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!$view_only && $use_stockfish): ?>
                <div class="chess-config-dialog">
                    <div class="config-dialog-content">
                        <div class="color-selector">
                            <button type="button" class="color-btn white active" data-color="white">
                                <?php _e('Blancs', 'roi'); ?>
                            </button>
                            <button type="button" class="color-btn random" data-color="random">
                                <?php _e('Aléatoire', 'roi'); ?>
                            </button>
                            <button type="button" class="color-btn black" data-color="black">
                                <?php _e('Noirs', 'roi'); ?>
                            </button>
                        </div>
                        <div class="difficulty-selector">
                            <label>
                                <?php _e('Difficulté :', 'roi'); ?>
                                <span class="elo-value"><?php echo esc_html($atts['stockfishElo']); ?></span>
                                ELO
                            </label>
                            <input type="range" class="elo-slider" min="1320" max="2800" value="<?php echo esc_attr($atts['stockfishElo']); ?>">
                        </div>
                        <button type="button" class="start-btn">
                            <?php _e('Commencer', 'roi'); ?>
                        </button>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <?php if (!$view_only): ?>
            <div class="chess-status"><?php _e('À vous de jouer', 'roi'); ?></div>
            <?php if (!$free_mode): ?>
                <div class="chess-controls">
                    <button type="button" class="control-btn new-game">
                        <?php _e('Nouvelle partie', 'roi'); ?>
                    </button>
                    <button type="button" class="control-btn flip-board">
                        <?php _e('Retourner', 'roi'); ?>
                    </button>
                    <button type="button" class="control-btn undo-move">
                        <?php _e('Annuler', 'roi'); ?>
                    </button>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </section>
</div>
