var marktingListTable;
var contactListTable;
var id;
var addedContactRow;
var contactObjects = new Set();

$(function () {
    InitMarketingListsTable();
    InitMarketingListContactTable();
    id = location.href.split('/')[location.href.split('/').length - 1];

    if (id === "MailingList")
        window.loadAndFilterContactTable();
    else {
        window.loadAndFilterContactTable(id);
    }
});

function InitMarketingListsTable() {
    var buttonConfig = [];
    buttonConfig.push({
        text: 'Создать новый',
        className: 'btn btn-primary rounded',
        action: function (e, dt, node, config) {
            window.modalNewMarketingList.open();
        }
    });

    marktingListTable = $('#marketing-lists-table').DataTable({
        dom: "<'row justify-content-between'<'col-sm-12 col-md-4'B><'col-sm-12 col-md-8'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-4'><'col-sm-12 col-md-8'p>>",
        pageLength: 10,
        "autoWidth": false,
        "drawCallback": function (settings) {
            if (settings.json) {
                window.marktingListTable.rows(function (idx, data, node) {
                    return id === data.id;
                }).select();
            } 
        },
        buttons: {
            buttons: buttonConfig,
            dom: {
                button: {
                    className: ''
                }
            }
        },
        "ajax": {
            "type": "GET",
            "url": `${api}/api/MarketingList/ForList`,
            "xhrFields": {
                withCredentials: true
            },
            "dataSrc": function (json) {
                json = json.map((el) => {
                    el.isSelected = el.id === id;
                    return el;
                });
                return json;
            }
        },
        "language": {
            url: "/lib/DataTables/datatables.language.russian.json"
        },
        "columnDefs": [
            { "className": "text-center", "targets": 2 },
            { "orderable": false, "targets": 3 }
        ],
        "columns": [
            {
                "data": "isSelected",
                "visible": false
            },
            {
                "data": "id",
                "className": "marketing-list-id",
                "visible": false
            },
            { "data": "name" },
            {
                "data": "isLocked",
                "visible": window.isTopOrMarketing,
                "render": function (data, type, row) {
                    if (window.isTopOrMarketing) {
                        if (row.isLocked)
                            return '<i class="fa fa-lock fa-2x text-danger" id="lock-' +
                                row.id +
                                '" onclick="toogleLock(\'' +
                                row.id +
                                '\', false, this)" aria-hidden="true"></i>';

                        return '<i class="fa fa-unlock fa-2x text-success" id="lock-' +
                            row.id +
                            '" onclick="toogleLock(\'' +
                            row.id +
                            '\', true, this)" aria-hidden="true"></i>';
                    }

                    return '';
                }
            },
            {
                "data": null,
                "visible": window.isTopOrMarketing,
                "render": function (data, type, row) {
                    if (window.isTopOrMarketing) {
                        return '<button id=\'delete-' +
                            data.id +
                            '\' class="btn btn-danger btn-sm remove" onclick="deleteMarketingList(\'' +
                            data.id +
                            '\', \'' +
                            data.name.replace(/"/g, '&quot;') +
                            '\', this)"><i class="fa remove fa-times" aria-hidden="true"></i></button>';
                    }

                    return '';
                }
            }
        ],
        order: [[0, "desc"]]
    });

    $('#marketing-lists-table').on('click',
        'tbody tr',
        function (e) {
            let isLocked = marktingListTable.row($(this)).data().isLocked;
            if (!$(e.target).hasClass('remove') && !$(e.target).hasClass('fa') && !isLocked)
                window.location.href = `/Campaigns/MailingList/${(marktingListTable.row(this).data()).id}`;

        });
    $('#marketing-lists-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });
}

function InitMarketingListContactTable() {

    contactListTable = $('#contacts-table').DataTable({
        dom: "<'row justify-content-between'<'col-sm-12 col-md-4'><'col-sm-12 col-md-8'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-4'B><'col-sm-12 col-md-8'p>>",
        pageLength: 10,
        "autoWidth": false,
        "height": "500px",
        "language": {
            url: "/lib/DataTables/datatables.language.russian.json"
        },
        "select": {
            "style": "multi"
        },
        buttons: [
            {
                extend: 'excel',
                text: 'Выгрузить в excel',
                exportOptions: {
                    modifier: {
                        selected: true
                    },
                    columns: ':visible'
                }
            }
        ],
        "columns": [
            { "data": '' },
            { "data": "id" },
            { "data": "displayName" },
            { "data": "email" },
            { "data": "organizationShortName" },
            { "data": "jobTitle" },
            { "data": "responsibleUserDisplayName" },
            { "data": "departmentName" },
            { "data": "presentTypeName" },
            { "data": "deliveryInfo" }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "data": null,
                "render": function (data, type, full, meta) {
                    if (meta.col === 0 && type === 'sort') 
                        return Array.from(contactObjects).some((el) => el.id === full.id) ? 1 : 0;
                     else 
                        return data;
                    
                },
                "defaultContent": '',
                "orderable": true,
                "className": 'select-checkbox'
            },
            {
                "targets": [1],
                "visible": false,
                "searchable": true
            }
        ]
    });

    $('#contacts-table tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            contactObjects.forEach((contact) => {
                if (contact.id === contactListTable.row($(this)).data().id) {
                    contactObjects.delete(contact);
                }
            });
            window.deleteContactFromMarketingList();
        } else {
            addedContactRow = contactListTable.row($(this));
            window.modalAddContactToMl.open();
            contactObjects.add(addedContactRow.data());
        }
    });
}