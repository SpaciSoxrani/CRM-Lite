function AcceptOrFinishAnswerRequest(date, departmentName) {
    if (date === null || date === undefined || date === "") {
        swal({
            title: "Заполните дату исполнения",
            icon: "info",
            button: "Ok"
        });

        return;
    }

    $.LoadingOverlay("show");
    var acceptRequestModel = {};

    acceptRequestModel.requestId = location.href.split('/')[location.href.split('/').length - 1];
    acceptRequestModel.crmUrl = location.origin;
    acceptRequestModel.userId = user.id;
    acceptRequestModel.acceptOrFinishDate = new Date(date);
    acceptRequestModel.departmentName = departmentName;

    $.ajax({
        type: "PUT",
        url: `${api}/api/ServicesRequests/AcceptRequest`,
        data: JSON.stringify(acceptRequestModel),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
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

            return;
        },
        dataType: 'JSON'
    });
}