var initModalToChangeUnit = () => {
    var modal = new RModal(document.getElementById('modal-change-unit'), {
        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            $('#responsible-mp-new').val(null).trigger('change');
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        modal.keydown(ev);
    }, false);

    window.changeUnitModal = modal;
};

var loadDataAndOpenModal = (depName, responsibleIds, executeDate, comment, answerId) => {
    $('#responsible-mp-new').select2();

    var datepickerData = $('#execute-date-new').datepicker({
        todayButton: new Date(),
        autoClose: true
    }).data('datepicker');

    datepickerData.selectDate(new Date(executeDate));

    $('.datepicker').css('z-index', 1500);

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function(data) {
            $.each(data,
                function (idx, a) {
                    if (!$('#responsible-mp-new').find("option[value='" + a.id + "']").length) {
                        var newOption = new Option(a.displayName, a.id, false, false);
                        $('#responsible-mp-new').append(newOption).trigger('change');
                    } 
                });

            $("#responsible-mp-new").val(responsibleIds).trigger('change');
        }
    });

    $('#unit-name').text(depName);
    $('#comments-new').val(comment);

    var totalLaboriousness = $('#total-laboriousness').attr('data-total-laboriousness');

    if (totalLaboriousness !== "0 чел/ч") {
        $('#laboriousness-new').val(totalLaboriousness.replace(".", ",")).trigger('change');
        window.Auto($('#laboriousness-new')[0]);
    }
        

    $('#changeAnswerInfo').on('click', () =>
        {
            changeIndustrialUnitInfo(answerId);
        });

    changeUnitModal.open();
};

var changeIndustrialUnitInfo = (answerId) => {
    var changeContract = {};
    changeContract.responsibleIds = $('#responsible-mp-new').val();
    changeContract.answerId = answerId;
    changeContract.executeDate = $('#execute-date-new').datepicker().data('datepicker').selectedDates[0].toDateString();
    changeContract.comment = $('#comments-new').val();
    changeContract.laboriousness = window.getNumberFromCurrency($('#laboriousness-new').val());

    $('.btn').attr('disabled', true);
    $('#changeAnswerInfo').html($('#changeAnswerInfo').text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    $.ajax({
        type: "PUT",
        url: `${api}/api/ServicesRequests/ChangeIndustrialUnitAnswerInfo`,
        data: JSON.stringify(changeContract),
        contentType: "application/json",
        success: function (data) {
            swal({
                title: "Успешно сохранено!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                location.reload();
            });	
        },
        error: function (data) {
            $('#changeAnswerInfo').find('.fa').remove();
            $('.btn').attr('disabled', false);
            swal({
                title: "Неизвестная ошибка, обратитесь к администратору системы",
                icon: "error",
                button: "Ok"
            });
        },
        xhrFields: {
            withCredentials: true
        }
    });
};