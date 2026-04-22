<?php
declare(strict_types=1);

namespace ROI\Services\Chess;

/**
 * Filtre pour remplacer les shortcodes de pièces d'échecs par des caractères Unicode.
 */
final class Pieces_Filter {

    /**
     * Initialisation des hooks.
     */
    public function init(): void {
        add_filter( 'the_content', [ $this, 'filter_content' ] );
        add_filter( 'widget_text_content', [ $this, 'filter_content' ] );
        add_filter( 'comment_text', [ $this, 'filter_content' ] );
    }

    /**
     * Remplace les shortcodes de pièces d'échecs par des caractères Unicode.
     *
     * @param string $content Le contenu à filtrer.
     * @return string Le contenu filtré.
     */
    public function filter_content( string $content ): string {
        $chess_pieces = [
            // Pièces Blanches
            '[RB]' => '<span class="roi-chess-piece">♔</span>', // U+2654 - Roi Blanc
            '[DB]' => '<span class="roi-chess-piece">♕</span>', // U+2655 - Dame Blanche
            '[TB]' => '<span class="roi-chess-piece">♖</span>', // U+2656 - Tour Blanche
            '[FB]' => '<span class="roi-chess-piece">♗</span>', // U+2657 - Fou Blanc
            '[CB]' => '<span class="roi-chess-piece">♘</span>', // U+2658 - Cavalier Blanc
            '[PB]' => '<span class="roi-chess-piece">♙</span>', // U+2659 - Pion Blanc
            // Pièces Noires
            '[RN]' => '<span class="roi-chess-piece">♚</span>', // U+265A - Roi Noir
            '[DN]' => '<span class="roi-chess-piece">♛</span>', // U+265B - Dame Noire
            '[TN]' => '<span class="roi-chess-piece">♜</span>', // U+265C - Tour Noire
            '[FN]' => '<span class="roi-chess-piece">♝</span>', // U+265D - Fou Noir
            '[CN]' => '<span class="roi-chess-piece">♞</span>', // U+265E - Cavalier Noir
            '[PN]' => '<span class="roi-chess-piece">♟</span>', // U+265F - Pion Noir
        ];

        return str_replace( array_keys( $chess_pieces ), array_values( $chess_pieces ), $content );
    }
}
