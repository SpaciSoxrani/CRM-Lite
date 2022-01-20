function SaveNotStartedRequest(isStarted) {
    var requestModal = {};

    requestModal.id = location.href.split('/')[location.href.split('/').length - 1];
    requestModal.PreparationDate = new Date();
    requestModal.ResponsibleUserId = window.user.id;
    requestModal.DealId = window.serviceRequest.dealId;
    requestModal.Name = window.serviceRequest.name;
    requestModal.DepartmentName = window.serviceRequest.departmentName;
    requestModal.DepartmentId = window.serviceRequest.departmentId;

    requestModal.IndustrialUnitServicesRequests =
        $('#industrial-units').val().reduce(function (acc, cur, i) {
            acc[i] = {
                "IndustrialUnitId": cur,
                "ServicesRequestId": requestModal.id
            };
            return acc;
        }, []);

    requestModal.IsStarted = isStarted;
    requestModal.AnotherResponsiblesServicesRequests =
        $('#another-responsibles').val().reduce(function (acc, cur, i) {
            acc[i] = {
                "ResponsibleId": cur,
                "ServicesRequestId": requestModal.id
            };
            return acc;
        }, []);

    requestModal.ContractNumber = $('#contract-number').val();
    requestModal.ContractDate = window.contractDateData.selectedDates[0] === undefined ? "" : window.contractDateData.selectedDates[0].toDateString();
    requestModal.ScoreNumber = $('#score-number').val();
    requestModal.DocumentForService = $('#document-for-service').val();
    requestModal.Service = $('#services').val();
    requestModal.AnotherImportantConditions = $('#important-condition').val();

    if (isStarted &&
        ((requestModal.ContractNumber === "" &&
            requestModal.ScoreNumber === "" &&
            requestModal.DocumentForService === "") ||
            requestModal.Service === "" ||
            requestModal.IndustrialUnitServicesRequests.length === 0)) {

        if (requestModal.ContractNumber === "" &&
            requestModal.ScoreNumber === "" &&
            requestModal.DocumentForService === "") {
            $('#contract-number').addClass('is-invalid');
            $('#score-number').addClass('is-invalid');
            $('#document-for-service').addClass('is-invalid');
        }

        if (requestModal.Service === "")
            $('#services').addClass('is-invalid');

        if (requestModal.IndustrialUnitServicesRequests.length === 0)
            $('#industrial-units').addClass('is-invalid');

        ShowErrorForStart();
        return;
    }

    $('.btn').attr('disabled', true);
    $('#save').html($('#save').text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");
    if (isStarted)
        $('#start-this-request').html($('#start-this-request').text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    $.ajax({
        type: "PUT",
        url: `${api}/api/ServicesRequests/${requestModal.id}`,
        data: JSON.stringify(requestModal),
        contentType: "application/json",
        success: function (data) {

            $('#save').find('.fa').remove();
            if (isStarted)
                $('#start-this-request').find('.fa').remove();
            $('.btn').attr('disabled', false);

            if (isStarted)
                swal({
                    title: "Успешно отправлена!",
                    icon: "success",
                    button: "Ok"
                }).then(() => {
                    location.reload();
                });
            else
                swal({
                    title: "Успешно сохранено!",
                    icon: "success",
                    button: "Ok"
                });

        },
        error: function (data) {
            alert("Ошибка при сохранении");
            $('#save').find('.fa').remove();
            if (isStarted)
                $('#start-this-request').find('.fa').remove();
            $('.btn').attr('disabled', false);
            console.error(data);
        },
        dataType: 'JSON'
    }).done(function () {

    });
};

function ShowErrorForStart() {
    $("#error-for-start").fadeIn(1500).fadeOut(1500);
}