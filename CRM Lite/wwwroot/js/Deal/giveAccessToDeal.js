
$(document).ready(function () {
    var modal = new RModal(document.getElementById('modal-give-access'), {
        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            next();
        }
    });

    $("#users").select2({
        placeholder: "Выберите элемент",
        allowClear: true
    });

    initDealAccessListTable();

    document.addEventListener('keydown', function (ev) {
        modal.keydown(ev);
    }, false);

    window.accessModal = modal;

  
});

var reloadUsers = () => {
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

var initDealAccessListTable = () => {
    var dealId = location.href.split('/')[location.href.split('/').length - 1];
    $("#additional-access-table").dataTable().fnDestroy();
    reloadUsers();

    var dealAccessListTable = $('#additional-access-table').DataTable({
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
            "url": `${api}/api/Deals/AdditionalAccess/${dealId}/${user.id}`,
            "dataSrc": function (json) {
                if (json.length === 0)
                    $('.additional-access-list').hide();

                return json;
            },
            "error": function() {
                $('.additional-access-list').hide();
            }
        },
        "columns": [
            {
                "data": "userId",
                "className": "id"
            },
            { "data": 'userName' },
            {
                "data": 'isAbleToEdit',
                "render": function (data, type, row) {
                    if (data)
                        return "Редактирование";

                    return "Просмотр";
                }
            },
            {
                "data": null,
                "render": function (data, type, row) {
                    return '<button id=' + data.userId + ' class="btn btn-danger remove" onclick="deleteAccess(\'' + data.userId + '\')">Удалить</button>';
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": true
            }
        ]
    });
};

var deleteAccess = (userId) => {

    var dealId = location.href.split('/')[location.href.split('/').length - 1];

    $.ajax({
        type: "DELETE",
        url: `${api}/api/Deals/AdditionalAccess/${dealId}/${userId}`,
        dataType: 'JSON',
        success: function(data) {
            var table = $('#additional-access-table').DataTable();
            table
                .row($('#' + userId).parents('tr'))
                .remove()
                .draw();
        },
        error: function(data) {
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному объекту!",
                    icon: "error",
                    button: "Ok"
                });
                return;
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok"
                });
            }
        }
    });
};


function giveAccess() {
    if ($('#users').val().length == 0) {
        swal({
            title: "Выберите сотрудников для выдачи доступа!",
            icon: "error",
            button: "Ok"
        });
        return;
    }
    let accessContract = {};
    accessContract.usersToAccess = [$('#users').val()];
    accessContract.isAbleToEdit = $("#isAbleToEditDeal").prop("checked");
    accessContract.dealId = location.href.split('/')[location.href.split('/').length - 1];
    accessContract.userId = user.id;

    $.ajax({
        type: "POST",
        url: `${api}/api/Deals/Access`,
        data: JSON.stringify(accessContract),
        contentType: "application/json",
        success: function (data) {
            console.log(data);

            if (data != "success")             
                getNotification(data, 0);
            else 
                swal({
                    title: "Доступ успешно выдан!",
                    icon: "success",
                    button: "Ok"
                }).then(() => {
                    accessModal.close();
                });            
        },
        error: function (data) {
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному действию!",
                    icon: "error",
                    button: "Ok"
                }).then(() => {
                    window.location.href = location.origin;
                });
                return;
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok"
                });
                return;
            }
        },
        complete: function () {
            $.LoadingOverlay("hide");
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}

function getNotification(usersToUpdate, userNumber) {
    if (userNumber < usersToUpdate.length)
        swal({
            title: "Вы уверены, что хотите изменить роль для " + usersToUpdate[userNumber].user.fullName + "?",
            type: "info",
            icon: "info",
            buttons: ["Отмена", "Да!"],
        }).then((value) => {
            if (value) 
                UpdateUserAccess(usersToUpdate, userNumber)
            else
                getNotification(usersToUpdate, userNumber + 1);
        });
    else
        swal({
            title: "Доступ успешно выдан!",
            icon: "success",
            button: "Ok"
        }).then(() => {
            accessModal.close();
        });
}

function UpdateUserAccess(usersToUpdate, userNumber) {
    let accessContract = {};
    accessContract.dealId = usersToUpdate[userNumber].dealId;
    accessContract.userId = usersToUpdate[userNumber].userId;
    accessContract.usersToAccess = [];
    accessContract.isAbleToEdit = usersToUpdate[userNumber].isAbleToEdit;

    $.ajax({
        type: "POST",
        url: `${api}/api/Deals/UpdateUserAccess`,
        data: accessContract,
        success: function (data) {
            console.log(data);
            getNotification(usersToUpdate, userNumber + 1);
        },
        complete: function () {
            $.LoadingOverlay("hide");
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}