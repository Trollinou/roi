(function($) {
    'use strict';

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
