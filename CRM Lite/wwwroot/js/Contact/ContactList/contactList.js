var contactData;
var table;

$(document).ready(function () {

    table = $('#contacts-table').DataTable({
        "language": {
            "url": "/lib/datatables/datatables.language.russian.json"
        },

        "ajax": {
            "type": "GET",
            "url": `${location.origin}/Contacts/ContactsForList`,
            "dataSrc": function (json) {

                contactData = json;

                window.InitializeFiltersForContList();
                window.InitializeEventTriggers();
                window.initializeFilterFunctions();
                json = window.initializeStartedContacts(json);

                table.clear();

                return json;
            }
        },
        "dom": "<'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-3 d-none'B><'col-sm-12 col-md-6'p>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'>>",
        "columns": [
            {
                "data": "id",
                "className": "id"
            },
            { "data": "lastName" },
            { "data": "firstName" },
            { "data": "middleName" },
            { "data": "organizationShortName" },
            { "data": "responsibleName" },
            {
                "data": null,
                "render": function (data, type, row) {
                    var name = data.lastName + ' ' + data.firstName;
                    return '<button id=' + data.id + ' class="btn remove" onclick="deleteContact(\'' + data.id + '\', \'' + name.replace(/"/g, '&quot;') + '\')"><i class="fa fa-times text-danger remove" aria-hidden="true"></i></button>';
                }
            },
            { "data": "city" }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": false
            },
            {
                "targets": [-1],
                "visible": false,
                "searchable": true
            }
        ],
        "buttons": [
            {
                extend: 'excel',
                text: 'Импорт в Excel'
            }
        ]
    });

    $('#contacts-table').on('click',
        'tbody tr',
        function (e) {
            if (!$(e.target).hasClass('remove'))
                window.open(`/Contacts/Contact/${(table.row(this).data()).id}`, '_blank');
        });
    $('#contacts-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });
});

var deleteContact = (id, name) => {
    if (confirm('Вы действительно хотите удалить контакт \"' + name + '\"?'))
        $.ajax({
            type: "PUT",
            url: `${location.origin}/Contacts/MakeInvisible/${id}`,
            success: function (data) {
                var table = $('#contacts-table').DataTable();
                table
                    .row($('#' + id).parents('tr'))
                    .remove()
                    .draw();
            },
            error: function (data) {
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
            },
        });
};