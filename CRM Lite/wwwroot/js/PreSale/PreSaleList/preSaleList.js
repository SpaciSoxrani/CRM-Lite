var table;
var contactData;
var preSaleGroupId;
var tableEditFields;

$(document).ready(function () {
    let href = location.href.split('/');
    preSaleGroupId = href[href.length - 1];

    table = $('#pre-sales-table').DataTable({
        "language": {
            "url": "/lib/datatables/datatables.language.russian.json"
        },
        "ajax": {
            "type": "GET",
            "url": `${api}/api/PreSales/ForPreSalesTable/${preSaleGroupId}`,
            "dataSrc": function (json) {
                contactData = json;

                tableEditFields = new DataTableFields(new Map(), getPreSaleDto, contactData, `${api}/api/PreSales/EditPreSale/`);
                settingFields();

                window.initializePreSalesFilters(json);
                window.initializePreSalesEvents();
                window.initializePreSalesFilterFunctions();
                json = window.initializeStartedItems(json);
                $('#pre-sale-group-name').text(window.groupName);
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
        "order": [[15, "asc"], [18, "asc"]],
        "orderFixed": {
            "post": [2, 'desc']
        },
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
                "name": "region",
                "data": "region",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("region").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "timezone",
                "data": "timezone",
                "className": "export",
            },
            {
                "name": "organization",
                "data": "organization",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("organization").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "fullName",
                "data": "fullName",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("fullName").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "jobTitle",
                "data": "jobTitle",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("jobTitle").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "phoneNumber",
                "data": "phoneNumber",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("phoneNumber").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "email",
                "data": "email",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("email").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "site",
                "data": "site",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("site").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "requestSent",
                "data": "requestSent",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("requestSent").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "incomingNumber",
                "data": "incomingNumber",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("incomingNumber").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "executorContact",
                "data": "executorContact",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("executorContact").getDataTableRender(data, row, type);
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
                "name": "status",
                "data": "status",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("status").getDataTableRender(data, row, type);
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
                "name": "result",
                "data": "result",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("result").getDataTableRender(data, row, type);
                }
            },
            {
                "name": "resultComments",
                "data": "resultComments",
                "className": "export",
                "render": function (data, type, row) {
                    return tableEditFields.listFields.get("resultComments").getDataTableRender(data, row, type);
                }
            },
            {
                "width": "2em",
                "orderable": false,
                "data": null,
                "visible": window.IsCanEdit,
                "render": function (data, type, row) {
                    return '<button id=' + row.id + ' class="btn remove" onclick="deletePreSale(\'' + row.id + '\')"><i class="fa fa-times text-danger remove" aria-hidden="true"></i></button>';
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
    switch (data.status) {
        case 'В работе':
            return 'status-in-work';
        case 'Позвонить':
            return 'status-call';
        case 'Передано сейлу':
            return data.result === 'Рассмотрели, но отказали' ? 'result-refused' : 'status-given-to-sale';
        case 'Не интересно':
            return 'status-not-interested';
        default:
            return '';
    }
}

function settingFields() {
    var responsibleUserField = new SelectField("responsibleUser");
    responsibleUserField.selectFieldId = 'pre-sale-edit-responsible-user';
    tableEditFields.relatedFields.set('responsibleUser', (rowValues) => {
        let dateNow = new Date();
        dateNow.setHours(12);
        rowValues.dayAppointment = dateNow;
    });
    responsibleUserField.isConfirm = true;
    responsibleUserField.confirmText = "{fieldText} будет отправлено уведомление. Вы уверены?";
    responsibleUserField.fillFieldUrl = `${api}/api/Users/IdsAndNames/Active`;
    responsibleUserField.fillFieldName = 'displayName'
    tableEditFields.addField('responsibleUser', responsibleUserField);

    var resultField = new SelectField("result");
    resultField.isNullable = true;
    resultField.selectFieldId = 'pre-sale-edit-result';
    resultField.fillFieldUrl = `${api}/api/PreSales/PreSaleResults`;
    tableEditFields.requiredFields.set('result', ['resultComments']);
    resultField.isSorting = true;
    resultField.sortMethod = (value, row) => {
        return value === 'Рассмотрели, но отказали' && row.status === 'Передано сейлу' ? 'яяяя' : value
    };
    tableEditFields.addField('result', resultField);

    var regionField = new SelectField("region");
    regionField.selectFieldId = 'pre-sale-edit-region';
    tableEditFields.relatedFields.set('region', (rowValues) => {
        let selectRegion = preSaleRegions.find(psr => psr.id === rowValues.regionId);
        if (selectRegion)
            rowValues.timezone = selectRegion.timezone;
        else
            rowValues.timezone = '';
    });
    regionField.fillFieldUrl = `${api}/api/PreSales/PreSaleRegions`;
    tableEditFields.addField('region', regionField);

    var statusField = new SelectField("status");
    statusField.selectFieldId = 'pre-sale-edit-status';
    statusField.isSorting = true;
    statusField.isNullable = true;
    statusField.sortMethod = (value) => {
        switch (value) {
            case 'В работе':
                return '3';
            case 'Позвонить':
                return '2';
            case 'Передано сейлу':
                return '1';
            case 'Не интересно':
                return '4';
            default:
                return '5';
        }
    };
    statusField.fillFieldUrl = `${api}/api/PreSales/PreSaleStatuses`;
    tableEditFields.addField('status', statusField);


    var organizationField = new TextareaField("organization", 100);
    organizationField.isRequired = true;
    tableEditFields.addField('organization', organizationField);

    var commentsField = new TextareaField("comments", 100);
    commentsField.renderClasses = ['comments-field'];
    commentsField.isCanScroll = true;
    tableEditFields.addField('comments', commentsField);

    var resultCommentsField = new TextareaField("resultComments", 100);
    resultCommentsField.renderClasses = ['comments-field'];
    resultCommentsField.isRequired = true;
    resultCommentsField.isCanScroll = true;
    tableEditFields.addField('resultComments', resultCommentsField);

    var dayAppointmentField = new InputDateField("dayAppointment");
    dayAppointmentField.isNotEditable = true;
    tableEditFields.addField('dayAppointment', dayAppointmentField);

    var siteField = new TextareaField("site", 1000);
    siteField.isHref = true;
    tableEditFields.addField('site', siteField);

    var fullNameField = new TextareaField("fullName", 1000);
    tableEditFields.addField('fullName', fullNameField);

    var jobTitleField = new TextareaField("jobTitle", 100);
    tableEditFields.addField('jobTitle', jobTitleField);

    var phoneNumberField = new TextareaField("phoneNumber", 100);
    tableEditFields.addField('phoneNumber', phoneNumberField);

    var emailField = new TextareaField("email", 100);
    tableEditFields.addField('email', emailField);

    var requestSentField = new TextareaField("requestSent", 50);
    tableEditFields.addField('requestSent', requestSentField);

    var incomingNumberField = new TextareaField("incomingNumber", 50);
    tableEditFields.addField('incomingNumber', incomingNumberField);

    var executorContactField = new TextareaField("executorContact", 100);
    tableEditFields.addField('executorContact', executorContactField);
}