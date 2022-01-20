var organizationData;
var table;

$(document).ready(function () {

    table = $('#organizations-table').DataTable({
        "language": {
            "url": "/lib/datatables/datatables.language.russian.json"
        },
        "ajax": {
            "type": "GET",
            "url": `${location.origin}/Organizations/GetOrganizationsForList`,
            "dataSrc": function (json) {

                organizationData = json;

                json = json.filter(org => org.isActive === true);
                $('#status-filter').selectpicker('val', "true");
                $(filterElementsMap.get('status-filter')).addClass('checked-filter');

                window.InitializeFiltersForOrgList();
                window.InitializeEventTriggers();
                window.initializeFilterFunctions();
                json = window.initializeStartedOrganizations(json);

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
            { "data": "shortName" },
            { "data": "responsibleName" },
            { "data": "email" },
            { "data": "isActive" },
            {
                "data": null,
                "render": function (data, type, row) {
                    return '<button id=' + data.id + ' class="btn remove" onclick="deleteOrganization(\'' + data.id + '\', \'' + data.shortName.replace(/"/g, '&quot;') + '\')"><i class="fa fa-times text-danger remove" aria-hidden="true"></i></button>';
                }
            },
            { "data": "fullName" },
            { "data": "city" }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": false
            },
            {
                "targets": [-1, -2],
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

    $('#organizations-table').on('click',
        'tbody tr',
        function (e) {
            if (!$(e.target).hasClass('remove'))
                window.open(`/Organizations/Organization/${(table.row(this).data()).id}`, '_blank');
        });
    $('#organizations-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });
});

var deleteOrganization = (id, name) => {
    if (confirm('Вы действительно хотите удалить организацию \"' + name + '\"?'))
        $.ajax({
            type: "PUT",
            url: `${location.origin}/Organizations/MakeInvisible/${id}`,
            success: function (data) {
                var table = $('#organizations-table').DataTable();
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