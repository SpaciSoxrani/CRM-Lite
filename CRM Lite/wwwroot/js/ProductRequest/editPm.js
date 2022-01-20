
function ShowPmFields() {
    $('#pm-fields').removeClass('d-none');
}

function HidePmFields() {
    $('#pm-fields').removeClass('d-none');
}

function AddPm() {
    if ($('#add-pm').val() === null) {
        $('#add-pm').addClass('is-invalid');
        return;
    }

    $.LoadingOverlay("show");

    var addPmModel = {};
    addPmModel.dealId = window.productRequest.dealId;
    addPmModel.requestId = window.productRequest.id;
    addPmModel.pmId = $('#add-pm').val();
    addPmModel.commentForPm = $('#add-comment').val();

    $.ajax({
        type: "PUT",
        url: `${api}/api/ProductRequests/AddAdditionalProduct`,
        data: JSON.stringify(addPmModel),
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            swal({
                title: "Ответственный продакт добавлен!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                location.reload();
            });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            console.error("add pm Error");
        },
        dataType: 'JSON'
    });
}

function SaveNewPm() {
    if ($('#responsible-pm').val() === null) {
        $('#responsible-pm').addClass('is-invalid');
        return;
    }

    $.LoadingOverlay("show");

    var editPmModel = {};
    editPmModel.dealId = window.productRequest.dealId;
    editPmModel.requestId = window.productRequest.id;
    editPmModel.pmId = $('#responsible-pm').val();
    editPmModel.commentForPm = $('#comment').val();

    $.ajax({
        type: "PUT",
        url: `${api}/api/Deals/Pm`,
        data: JSON.stringify(editPmModel),
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            swal({
                title: "Ответственный продакт добавлен!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                location.reload();
            });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            console.error("edit pm Error");
        },
        dataType: 'JSON'
    });
}