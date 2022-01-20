function SendAnswer() {
    $.LoadingOverlay("show");
    let executionDate = $('#answer-execution-date').val();

    if (executionDate === "") {
        $('#answer-execution-date').addClass('is-invalid');
        return;
    }

    var answerModel = {};
    answerModel.requestId = window.productRequest.id;
    answerModel.executionDate = new Date(executionDate);

    $.ajax({
        type: "PUT",
        url: `${api}/api/ProductRequests/Answer`,
        data: JSON.stringify(answerModel),
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            swal({
                title: "Заявка принята!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                location.reload();
            });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            console.error("answer Error");
        },
        dataType: 'JSON'
    });
}

function ShowAnswerBlock() {
    $('#answer').removeClass('d-none');
    $('#decision-of-department-head').addClass('d-none');
}

function ShowSwipeProductBlock() {
    $('#swipe-product').removeClass('d-none');
    $('#decision-of-department-head').addClass('d-none');
}