var table;
var contactData;
var tableEditFields;

$(document).ready(function () {
    table = $('#leads-table').DataTable({
        "language": {
            "url": "/lib/datatables/datatables.language.russian.json"
        },
        "ajax": {
            "type": "GET",
            "url": `${api}/api/Leads/ForLeadsTable`,
            "dataSrc": function (json) {
                contactData = json;

                tableEditFields = new DataTableFields(new Map(), getLeadDto, contactData, `${api}/api/Leads/EditLead/`)
                settingFields();

                window.initializeLeadsFilters(json);
                window.initializeLeadsEvents();
                window.initializeLeadsFilterFunctions();
                json = window.initializeStartedItems(json);
                table.clear();

                return json;
            },
            "error": function (json) {
                showErrorWindow(json.status);
            }
        },
        "rowId": "id",
        "autoWidth": true,
        "paging": false,
        "dom": "<'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-3 d-none'B><'col-sm-12 col-md-6'i>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'><'col-sm-12 col-md-7'>>",
        "order": [[4, "desc"]],
        "columns": [
            {
                "orderable": false,
                "searchable": false,
                "className": "export",
                "data": null,
            },
            {
                "orderable": false,
                "searchable": false,
                "data": "id",
                "className": "id",
                "visible": false
            },
            {
                "searchable": false,
                "data": "changedDate",
                "visible": false,
            },
            {
                "name": "project",
                "data": "project",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("project").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "receiptDate",
                "data": "receiptDate",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("receiptDate").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "content",
                "data": "content",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("content").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "target",
                "data": "target",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("target").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "comments",
                "data": "comments",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("comments").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "responsibleUser",
                "data": "responsibleUser",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("responsibleUser").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "dayAppointment",
                "data": "dayAppointment",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("dayAppointment").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "status",
                "data": "status",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("status").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "result",
                "data": "result",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("result").getDataTableRender(data, row, type);
                }
            },
            {
                "width": "2em",
                "orderable": false,
                "data": null,
                "visible": window.IsCanEdit,
                "render": function (data, type, row) {
                    return '<button id=' + row.id + ' class="btn remove" onclick="deleteLead(\'' + row.id + '\')"><i class="fa fa-times text-danger remove" aria-hidden="true"></i></button>';
                }
            }
        ],
        "createdRow": function (row, data, dataIndex) {
            $(row).addClass(statusRowRender(data));
        },
        "buttons": [
            {
                extend: 'excel',
                text: 'Импорт в Excel',
                exportOptions: {
                    columns: ".export",
                    format: {
                        body: function (data, rowIndx, columnIdx, nodeCell) {
                            if (columnIdx == 0) {
                                return rowIndx + 1;
                            }
                            return $(nodeCell).text();
                        }
                    }
                }
            }
        ]
    });

    table.on('order.dt search.dt', function () {
        table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function (cell, i) {
            cell.innerHTML = i + 1;
        });
    }).draw();

    if(window.IsCanEdit) {
        table.on('dblclick', 'td', function () {
            var cell = table.cell(this);
            var tr = $(this).closest('tr');
            var row = table.row(tr).data();
            var columns = table.settings().init().columns;

            tableEditFields.editField(row, $(this).children()[0], columns[cell.index().column].name)
        });
    }
});

function statusRowRender(data) {
    switch (data.target) {
        case 'Целевой':
            return data.status === 'Не интересно' ? 'is-not-target' : 'is-target';
        case 'Нецелевой':
            return 'is-not-target';
        default:
            return '';
    }
}

function settingFields() {
    var responsibleUserField = new SelectField("responsibleUser");
    responsibleUserField.selectFieldId = 'pre-sale-edit-responsible-user';
    tableEditFields.relatedFields.set('responsibleUser', (fieldName) => {
        let dateNow = new Date();
        dateNow.setHours(12);
        fieldName.dayAppointment = dateNow;
    });
    responsibleUserField.isConfirm = true;
    responsibleUserField.confirmText = "{fieldText} будет отправлено уведомление. Вы уверены?";
    responsibleUserField.fillFieldUrl = `${api}/api/Users/IdsAndNames/Active`;
    responsibleUserField.fillFieldName = 'displayName'
    tableEditFields.addField('responsibleUser', responsibleUserField);

    var statusField = new SelectField("status");
    statusField.selectFieldId = 'lead-edit-status';
    statusField.isNullable = true;
    statusField.fillFieldUrl = `${api}/api/Leads/LeadStatuses`;
    tableEditFields.addField('status', statusField);

    var targetField = new SelectField("target");
    targetField.selectFieldId = 'lead-edit-target';
    targetField.isNullable = true;
    targetField.fillFieldUrl = `${api}/api/Leads/LeadTargets`;
    tableEditFields.addField('target', targetField);

    var dayAppointmentField = new InputDateField("dayAppointment");
    dayAppointmentField.isNotEditable = true;
    tableEditFields.addField('dayAppointment', dayAppointmentField);

    var projectField = new TextareaField("project");
    projectField.isNotEditable = true;
    projectField.isHref = true;
    tableEditFields.addField('project', projectField);

    var receiptDateField = new InputDateField("receiptDate");
    receiptDateField.isNotEditable = true;
    receiptDateField.isSorting = true;
    receiptDateField.sortMethod = (value) => value;
    tableEditFields.addField('receiptDate', receiptDateField);

    var resultsField = new TextareaField("result", 300);
    resultsField.renderClasses = ['comments-field'];
    resultsField.isCanScroll = true;
    tableEditFields.addField('result', resultsField);

    var commentsField = new TextareaField("comments", 200);
    commentsField.renderClasses = ['comments-field'];
    commentsField.isCanScroll = true;
    tableEditFields.addField('comments', commentsField);

    var contentField = new TextareaField("content", 1000);
    contentField.isNotEditable = true;
    contentField.renderClasses = ['content-field'];
    contentField.isCanScroll = true;
    tableEditFields.addField('content', contentField);
}