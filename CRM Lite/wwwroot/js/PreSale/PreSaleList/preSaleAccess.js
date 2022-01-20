$(document).ready(function () {
    $("#users").select2({
        placeholder: "Выберите элемент",
        allowClear: true
    });
});

function initPreSaleAccessListTable() {
    openModalAccess();

    $("#additional-access-table").dataTable().fnDestroy();
    reloadUsers();

    var preSaleAccessListTable = $('#additional-access-table').DataTable({
        dom: 'Bfrtip',
        pageLength: 7,
        buttons: [
            {
                extend: 'colvis',
                text: 'Показать/скрыть столбцы',
                className: "d-none"
            }
        ],
        "language": {
            url: "/lib/datatables/datatables.language.russian.json"
        },
        "ajax": {
            "type": "GET",
            "url": `${api}/api/PreSales/GroupAccess/${window.preSaleGroupId}`,
            "dataSrc": function (json) {
                return json;
            },
            "error": function (json) {
                showErrorWindow(json.status);
            }
        },
        "columns": [
            {
                "data": "userId",
                "className": "id",
                "visible": false,
                "searchable": true
            },
            { "data": 'user' },
            {
                "data": 'isAbleToEdit',
                "render": function (data, type, row) {
                    return data ? "Редактирование" : "Просмотр";
                }
            },
            {
                "data": null,
                "render": function (data, type, row) {
                    return '<button id=' + row.userId + ' class="btn btn-danger remove" onclick="deleteAccess(\'' + row.userId + '\')">Удалить</button>';
                }
            }
        ],
    });
}

function reloadUsers() {
    var users = $('#users');
    users.empty();

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            $.each(data, function (idx, a) {
                users.append(new Option(a.displayName, a.id));
            });
            users.val("");
        },
        xhrFields: {
            withCredentials: true
        }
    });
}

function giveAccess() {
    if ($('#users').val().length == 0) {
        formIsInvalid.fire({
            title: "Выберите сотрудников для выдачи доступа!"
        });
        return;
    }
    let accessContract = {};
    accessContract.usersToAccess = [$('#users').val()];
    accessContract.isAbleToEdit = $("#isAbleToEditDeal").prop("checked");
    accessContract.preSaleGroupId = window.preSaleGroupId;

    $.ajax({
        type: "POST",
        url: `${api}/api/PreSales/AddPreSaleGroupAccess`,
        data: JSON.stringify(accessContract),
        contentType: "application/json",
        success: function (data) {
            console.log(data);

            if (data != "success")
                getNotification(data, 0);
            else
                requestSuccessful.fire({
                    title: "Доступ успешно выдан!",
                }).then(() => {
                    closeModalAccess();
                });
        },
        error: function (data) {
            showErrorWindow(data.status);
            return;
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}

function deleteAccess(userId) {
    $.ajax({
        type: "DELETE",
        url: `${api}/api/PreSales/DeletePreSaleGroupAccess/${window.preSaleGroupId}/${userId}`,
        dataType: 'JSON',
        success: function (data) {
            let preSaleAccessListTable = $('#additional-access-table').DataTable();
            preSaleAccessListTable
                .row($('#' + userId).parents('tr'))
                .remove()
                .draw();
        },
        error: function (data) {
            showErrorWindow(data.status);
        }
    });
};

function getNotification(usersToUpdate, userNumber) {
    if (userNumber < usersToUpdate.length)
        editAccessInfo.fire({
            title: "Вы уверены, что хотите изменить роль для " + usersToUpdate[userNumber].user.fullName + "?"
        }).then((result) => {
            result.isConfirmed ? updateUserAccess(usersToUpdate, userNumber) : getNotification(usersToUpdate, userNumber + 1);
        });
    else
        requestSuccessful.fire({
            title: "Доступ успешно выдан!"
        }).then(() => {
            closeModalAccess();
        });
}

function updateUserAccess(usersToUpdate, userNumber) {
    let accessContract = {};
    accessContract.preSaleGroupId = usersToUpdate[userNumber].preSaleGroupId;
    accessContract.userId = usersToUpdate[userNumber].userId;
    accessContract.usersToAccess = [];
    accessContract.isAbleToEdit = usersToUpdate[userNumber].isAbleToEdit;

    $.ajax({
        type: "PUT",
        url: `${api}/api/PreSales/EditPreSaleGroupAccess`,
        data: JSON.stringify(accessContract),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
            getNotification(usersToUpdate, userNumber + 1);
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}