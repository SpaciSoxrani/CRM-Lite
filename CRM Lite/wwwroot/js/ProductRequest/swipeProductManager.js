
function SwipeProductManager() {
    var swipePmModel = {};
    swipePmModel.newPmId = $("#new-responsible-product").val();
    swipePmModel.newComment = $("#new-comment").val();

    if (swipePmModel.newPmId === null) {
        $("#new-responsible-product").addClass('is-invalid');
        return;
    }

    swipePmModel.requestId = window.productRequest.id;

    $.LoadingOverlay("show");

    $.ajax({
        type: "PUT",
        url: `${api}/api/ProductRequests/SwipeProductManager`,
        data: JSON.stringify(swipePmModel),
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            swal({
                title: "Успешно сохранено!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                window.close();
            });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            console.log("Swipe PM Error");
        },
        dataType: 'JSON'
    });
}