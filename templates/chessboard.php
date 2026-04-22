<?php
/**
 * Template pour l'affichage de l'échiquier
 */

if (!defined('ABSPATH')) {
    exit;
}

// Détecter si on est dans l'éditeur (requête REST API)
$is_editor = defined('REST_REQUEST') && REST_REQUEST;

// Dans l'éditeur, désactiver le dialogue et le moteur pour éviter les conflits
if ($is_editor) {
    $enable_engine = false;
}
?>

<div class="chess-engine-container">
    <?php if ($enable_engine && !$is_editor): ?>
    <div class="chess-config-dialog" id="config-<?php echo esc_attr($board_id); ?>">
        <div class="chess-config-content">
            <h3><?php _e('Nouvelle partie', 'roi'); ?></h3>
            
            <div class="chess-config-section">
                <label><?php _e('Jouer avec :', 'roi'); ?></label>
                <div class="chess-color-selector">
                    <button class="color-btn" data-color="white">
                        <span class="color-icon">♔</span>
                        <?php _e('Blancs', 'roi'); ?>
                    </button>
                    <button class="color-btn" data-color="random">
                        <span class="color-icon">⚄</span>
                        <?php _e('Aléatoire', 'roi'); ?>
                    </button>
                    <button class="color-btn" data-color="black">
                        <span class="color-icon">♚</span>
                        <?php _e('Noirs', 'roi'); ?>
                    </button>
                </div>
            </div>
            
            <div class="chess-config-section">
                <label><?php _e('Niveau de difficulté :', 'roi'); ?></label>
                <div class="level-display">
                    <span class="elo-label"><?php _e('ELO approximatif', 'roi'); ?> : </span>
                    <span class="level-value"></span>
                </div>
                <input type="range" class="chess-level-slider" min="1200" max="2800" value="<?php echo esc_attr($atts['engineElo']); ?>" step="100">
                <div class="level-labels">
                    <span><?php _e('Débutant', 'roi'); ?></span>
                    <span><?php _e('Expert', 'roi'); ?></span>
                </div>
            </div>
            
            <button class="chess-btn chess-start-btn"><?php _e('Commencer', 'roi'); ?></button>
        </div>
    </div>
    <?php endif; ?>
    
    <div id="<?php echo esc_attr($board_id); ?>" 
         class="chess-board-wrapper"
         data-fen="<?php echo esc_attr($atts['fen']); ?>"
         data-orientation="<?php echo esc_attr($atts['orientation']); ?>"
         data-engine-elo="<?php echo esc_attr($atts['engineElo']); ?>"
         data-enable-engine="<?php echo ($enable_engine && !$is_editor) ? 'true' : 'false'; ?>"
         data-enable-moves="<?php echo $enable_moves ? 'true' : 'false'; ?>"
         data-border-type="<?php echo esc_attr($atts['borderType']); ?>"
         data-show-coordinates="<?php echo $atts['showCoordinates'] ? 'true' : 'false'; ?>"
         data-pieces="<?php echo esc_attr($atts['pieces']); ?>"
         data-css-class="<?php echo esc_attr($atts['cssClass']); ?>">
    </div>
    
    <?php if (($enable_engine || $enable_moves) && !$is_editor): ?>
    <div class="chess-controls">
        <?php if ($enable_engine): ?>
        <button class="chess-btn" data-action="reset"><?php _e('Nouvelle partie', 'roi'); ?></button>
        <?php endif; ?>
        <button class="chess-btn" data-action="flip"><?php _e('Retourner', 'roi'); ?></button>
        <?php if ($enable_moves): ?>
        <button class="chess-btn" data-action="undo"><?php _e('Annuler', 'roi'); ?></button>
        <?php endif; ?>
    </div>
    <?php endif; ?>
    
    <?php if (($enable_engine || $enable_moves) && !$is_editor): ?>
    <div class="chess-status"></div>
    <?php endif; ?>
</div>
