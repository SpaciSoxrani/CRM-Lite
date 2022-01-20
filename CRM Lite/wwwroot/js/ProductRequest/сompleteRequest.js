function CompleteRequest() {
    $.LoadingOverlay("show");

    $.ajax({
        type: "PUT",
        url: `${api}/api/ProductRequests/Complete/${window.productRequest.id}`,
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            swal({
                title: "Заявка выполнена!",
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