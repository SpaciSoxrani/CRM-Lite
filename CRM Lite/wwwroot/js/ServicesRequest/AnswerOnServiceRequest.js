function SaveAnswer() {
    let sendAnswerModel = {};
    sendAnswerModel.serviceRequestId = location.href.split('/')[location.href.split('/').length - 1];
    sendAnswerModel.departmentId = $('#user-unit').val();
    sendAnswerModel.responsiblePM = $('#add-mp').val();
    sendAnswerModel.executeDate = $('#execute-date').val();
    sendAnswerModel.laboriousness = getNumberFromCurrency($('#laboriousness').val());
    sendAnswerModel.comment = $('#comments').val();

    if (!sendAnswerModel.departmentId || !sendAnswerModel.executeDate) {
        if (!sendAnswerModel.departmentId) {
            $('#user-unit').parent().addClass('required-field-group-highlighted');
        } else
            $('#user-unit').parent().removeClass('required-field-group-highlighted');

        if (!sendAnswerModel.executeDate) {
            $('#execute-date').addClass('is-invalid');
        } else
            $('#execute-date').removeClass('is-invalid');

        $('#error').fadeIn(1500).fadeOut(1500);
        return;
    }
     
    $('.btn').attr('disabled', true);
    $('#accept-request').html($('#accept-request').text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");
        
    $.ajax({
        type: "POST",
        url: `${api}/api/SaveAnswer`,
        data: JSON.stringify(sendAnswerModel),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
            $('#accept-request').find('.fa').remove();
            $('.btn').attr('disabled', false);
            if (data === "Ответ уже был дан") {
                $.LoadingOverlay("hide");
                swal({
                    title: data,
                    icon: "info",
                    button: "Ok",
                });
                return;
            } else if (data === "Вашего отдела нет в заявке") {
                $.LoadingOverlay("hide");
                swal({
                    title: data,
                    icon: "info",
                    button: "Ok",
                });
                return;
            } else {
                $.LoadingOverlay("hide");

                swal({
                    title: "Успешно сохранено!",
                    icon: "success",
                    button: "Ok"
                }).then(() => {
                    location.reload();
                });
            }
        },
        xhrFields: {
            withCredentials: true
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            $('#accept-request').find('.fa').remove();
            $('.btn').attr('disabled', false);
            alert("Ошибка при сохранении заявки");
        },
        dataType: 'JSON'
    });
}