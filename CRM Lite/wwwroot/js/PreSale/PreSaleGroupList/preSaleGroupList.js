var contactData;
var table;

$(document).ready(function () {

    table = $('#pre-sale-groups-table').DataTable({
        "language": {
            "url": "/lib/datatables/datatables.language.russian.json"
        },
        "ajax": {
            "type": "GET",
            "url": `${location.origin}/PreSales/ForGroupsTable`,
            "dataSrc": function (json) {
                contactData = json;

                window.initializePreSaleGroupsFilters();
                window.initializePreSaleGroupsEvents();
                window.initializePreSaleGroupsFilterFunctions();
                json = window.initializeStartedItems(json);

                table.clear();

                return json;
            },
            "error": function (json) {
                showErrorWindow(json.status);
            }
        },
        "dom": "<'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-3 d-none'B><'col-sm-12 col-md-6'p>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'>>",
        "autoWidth": true,
        "columns": [
            {
                "data": "id",
                "className": "id"
            },
            { "data": "name" },
            {
                "data": "status",
                "render": function (data, type, row) {
                    switch (data) {
                        case 'В работе':
                            return '<div class="col-5 rounded status-in-work">' + data + '</div>';
                        default:
                            return '<div class="col-5 rounded status-close">' + data + '</div>'
                    }
                }
            },
            { "data": "department" },
            {
                "width": "2em",
                "orderable": false,
                "data": null,
                "visible": window.IsCanEdit,
                "render": function (data, type, row) {
                    return '<button class="btn remove" onclick="editPreSaleGroup(\'' + data.id + '\')"><i class="fa fa-pencil text-danger remove" aria-hidden="true"></i></button>';
                }
            },
            {
                "width": "2em",
                "orderable": false,
                "data": null,
                "visible": window.IsCanEdit,
                "render": function (data, type, row) {
                    return '<button id=' + data.id + ' class="btn remove" onclick="deletePreSaleGroup(\'' + data.id + '\', \'' + data.name.replace(/"/g, '&quot;') + '\')"><i class="fa fa-times text-danger remove" aria-hidden="true"></i></button>';
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": false
            }
        ],
        "order": [[2, "asc"]]
    });

    $('#pre-sale-groups-table').on('click',
        'tbody tr',
        function (e) {
            if (!$(e.target).hasClass('remove'))
                window.open(`/PreSales/${(table.row(this).data()).id}`, '_blank');
        });
    $('#pre-sale-groups-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });
})