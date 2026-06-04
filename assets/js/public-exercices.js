/**
 * @file Manages the interactive exercise interface for the [roi_exercices] shortcode.
 * @author Your Name
 * @version 1.0.0
 */

(function($) {
    'use strict';

    /**
     * Initializes the exercise interface on document ready.
     * @namespace
     */
    $(document).ready(function() {
        let scoreCorrect = 0;
        let scoreAttempted = 0;
        let currentExerciseId = null;

        // Start fetching exercises
        $('#roi-start-exercices').on('click', function() {
            fetchNextExercise();
        });

        // Delegate click for answer submission
        $('#roi-exercice-display').on('click', '#roi-submit-answer', function() {
            submitAnswer();
        });

        // Delegate click for next exercise
        $('#roi-exercice-display').on('click', '#roi-next-exercice', function() {
            fetchNextExercise();
        });

        /**
         * Fetches the next exercise based on the selected filters.
         * This function makes an AJAX call to retrieve a random exercise
         * matching the difficulty and category criteria. It avoids showing the
         * same exercise twice in a row.
         * @returns {void}
         */
        function fetchNextExercise() {
            const difficulty = $('#roi-difficulty-filter').val();
            const category = $('#roi-category-filter').val();
            const displayDiv = $('#roi-exercice-display');

            displayDiv.html('<p>Chargement du prochain exercice...</p>');

            $.ajax({
                url: roi_exercices_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'roi_fetch_exercice',
                    nonce: roi_exercices_ajax.nonce,
                    difficulty: difficulty,
                    category: category,
                    exclude: currentExerciseId // To avoid showing the same one twice in a row
                },
                success: function(response) {
                    if (response.success) {
                        displayDiv.html(response.data.html);
                        currentExerciseId = response.data.id;
                    } else {
                        displayDiv.html('<p>' + response.data + '</p>');
                    }
                },
                error: function() {
                    displayDiv.html('<p>Une erreur est survenue.</p>');
                }
            });
        }

        /**
         * Submits the user's answer for the current exercise.
         * This function sends the serialized form data via an AJAX call to be
         * checked. It then displays feedback, the solution, updates the score,
         * and shows the 'Next Exercise' button.
         * @returns {void}
         */
        function submitAnswer() {
            const exerciseId = $('#roi-exercice-id').val();
            const answerData = $('#roi-exercice-form').serialize();
            const solutionDiv = $('#roi-exercice-solution');
            const submitButton = $('#roi-submit-answer');

            submitButton.prop('disabled', true);

            $.ajax({
                url: roi_exercices_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'roi_check_answer',
                    nonce: roi_exercices_ajax.nonce,
                    exercise_id: exerciseId,
                    answer: answerData
                },
                success: function(response) {
                    scoreAttempted++;
                    $('#roi-score-attempted').text(scoreAttempted);

                    if (response.success) {
                        if (response.data.correct) {
                            scoreCorrect++;
                            $('#roi-score-correct').text(scoreCorrect);
                            solutionDiv.before('<p style="color:green;">' + response.data.message + '</p>');
                        } else {
                             let feedbackHtml = '<p style="color:red;">' + response.data.message + '</p>';
                             if (response.data.correct_answers) {
                                 feedbackHtml += '<p>' + "La bonne réponse était :" + '</p>' + response.data.correct_answers;
                             }
                             solutionDiv.before(feedbackHtml);
                        }
                        solutionDiv.html(response.data.solution).show();
                        submitButton.hide();
                        $('#roi-next-exercice').show();
                    } else {
                        solutionDiv.before('<p style="color:red;">' + response.data + '</p>');
                        submitButton.prop('disabled', false);
                    }
                },
                error: function() {
                     solutionDiv.before('<p style="color:red;">Une erreur est survenue.</p>');
                     submitButton.prop('disabled', false);
                }
            });
        }
    });

})(jQuery);
