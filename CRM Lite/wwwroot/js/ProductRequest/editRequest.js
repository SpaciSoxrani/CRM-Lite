function EditRequest(start) {
    var requestModal = {};

    requestModal.isRepeatStatement = $('#repeat-deal').prop('checked');
    requestModal.quests = [
        {
            quest: $('#quests').val().trim()
}
    ];
    requestModal.techContactId = $('#tech-contact').val();
    requestModal.admContactId = $('#adm-contact').val();

    let vendorsCount = $('#vendors-block')[0].children.length;

    let vendorsRequestDtos = [];

    for (let i = 0; i < vendorsCount; i++) {

        if ($('#responsible-product' + i).val() !== null) {
            vendorsRequestDtos.push({
                vendorId: $('#vendor' + i).val(),
                responsibleId: $('#responsible-product' + i).val()
            });
        }
    }

    requestModal.vendorsRequestDtos = vendorsRequestDtos;
    requestModal.anotherResponsiblesProductRequests = $('#another-responsible').val();
    requestModal.dealId = window.productRequest.dealId;

    var isValid = true;

    if (start) {
        isValid = requestModal.quests[0].quest !== "" &&
            requestModal.techContactId !== null &&
            requestModal.admContactId !== null &&
            requestModal.vendorsRequestDtos.length !== 0;
    }

    if (isValid) {
        $.LoadingOverlay("show");

        if (start)
            $.ajax({
                type: "PUT",
                url: `${api}/api/ProductRequests/${window.productRequest.id}/Start`,
                data: JSON.stringify(requestModal),
                contentType: "application/json",
                success: function (data) {
                    $.LoadingOverlay("hide");

                    swal({
                        title: "Успешно отправлена!",
                        icon: "success",
                        button: "Ok"
                    }).then(() => {
                        location.reload();
                    });
                },
                error: function (data) {
                    $.LoadingOverlay("hide");
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                    console.log(data);
                },
                dataType: 'JSON',
                xhrFields: {
                    withCredentials: true
                }
            });
        else
            $.ajax({
                type: "PUT",
                url: `${api}/api/ProductRequests/${window.productRequest.id}`,
                data: JSON.stringify(requestModal),
                contentType: "application/json",
                success: function (data) {
                    $.LoadingOverlay("hide");

                    swal({
                        title: "Успешно сохранено!",
                        icon: "success",
                        button: "Ok"
                    }).then(() => {
                        location.reload();
                    });
                },
                error: function (data) {
                    $.LoadingOverlay("hide");
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                    console.log(data);
                },
                dataType: 'JSON',
                xhrFields: {
                    withCredentials: true
                }
            });
    }
    else {
        //throwInvalidModelError();
        console.error("Не все поля заполнены!")
    }
}

function throwInvalidModelError() {
    var ss = document.getElementById("error");
    if (ss.style.visibility === "visible") $('#error').toggle();
    ss.style.visibility = "visible";
    $('#error').fadeOut(4000);
}
