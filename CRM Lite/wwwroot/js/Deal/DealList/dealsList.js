var dealsData;
var table;

$(document).ready(function () {
    table = $('#deals-table').DataTable({
        "language": {
            "url": "/lib/datatables/datatables.language.russian.json"
        },
        "ajax": {
            "type": "GET",
            "url": `${api}/api/DealsWithFourFieldsById/${user.id}`,
            //"contentType": "application/json",
            "xhrFields": {
                withCredentials: true
            },
            "dataSrc": function (json) {
                json.map((p) => {
                    p.estimatedBudget = thousandSeparator(p.estimatedBudget);
                    p.estimatedMargin = thousandSeparator(p.estimatedMargin);
                    p.responsibleProduct = p.responsibleProduct.split(' ');
                    p.responsibleMP = p.responsibleMP.split(' ');
                });

                let currentYear = new Date().getFullYear();
                if (ignoreActive)
                    json = json.filter(deal => deal.closureDateYear === currentYear);

                dealsData = json;

                if (!ignoreActive) {
                    json = json.filter(deal => deal.dealStatus === "Активная");
                    window.editFilterFunction('status-filter', (deal) => deal.dealStatus === "Активная");
                }

                if (ignoreCookie) {
                    window.ClearFilterCookies();
                    if (!isLogistics) {
                        if (isProduct)
                            window.Cookies.set('responsible-product-filter', salesId, { expires: 60 });
                        else
                            window.Cookies.set('sale-filter', salesId, { expires: 60 });
                    }

                    window.Cookies.set('step-filter', stepId, { expires: 60 });
                }

                window.InitializeFiltersForDealList();
                window.InitializeEventTriggers();
                window.initializeFilterFunctions();
                json = window.initializeStartedDeals(json);

                table.clear();

                return json;
            }
        },
        dom: "<'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'p>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'>>",
        pageLength: 10,
        "columns": [
            {
                "data": "id",
                "className": "id"
            },
            {
                "data": "name",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return data.replace(/\"/g, '');
                    return data;
                }
            },
            { "data": "dealStatus" },
            { "data": "responsibleName" },
            {
                "data": "stepName",
                "type": "num",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return full.stepNumber;
                    return data;
                }
            },
            {
                "data": "estimatedBudget",
                "type": "num",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "estimatedMargin",
                "type": "num",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "contractSigningDate",
                "sType": "ruDate",
                "mRender": function (data, type, full) {
                    if (type === 'sort' && data === "Неизвестная дата") return '31.12.9999';
                    return data;
                }
            },
            {
                "data": null,
                "render": function (data, type, row) {
                    return '<button id=' + data.id + ' class="btn btn-danger remove" onclick="deleteDeal(\'' + data.id + '\', \'' + data.name.replace(/"/g, '&quot;') + '\')"><i class="fa remove fa-times" aria-hidden="true"></i></button>';
                }
            },
            { "data": "organizationFullName" }

        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": false
            },
            {
                "targets": [9],
                "visible": false,
                "searchable": true
            }
        ],
        "order": [[2, "asc"]]
    });

    $('#deals-table').on('click',
        'tbody tr',
        function (e) {
            if (!$(e.target).hasClass('remove'))
                window.open(`/Deals/Deal/${(table.row(this).data()).id}`, '_blank');

        });
    $('#deals-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });

    extendSortFunction();
});

function thousandSeparator(str) {
    if ((str === "") || ((str === null)) || ((str === "0.00"))) return "";
    var parts = (str + '').split('.'),
        main = parts[0],
        len = main.length,
        output = '',
        i = len - 1;

    while (i >= 0) {
        output = main.charAt(i) + output;
        if ((len - i) % 3 === 0 && i > 0 && main.charAt(i - 1) !== '-') {
            output = ' ' + output;
        }
        --i;
    }
    if (parts.length > 1) {
        if (parts[1].length === 1) parts[1] += '0';
        output += ',' + parts[1] + " ₽";
    } else {
        output += ",00 ₽";
    }
    return output;
}

var deleteDeal = (id, name) => {
    if (confirm('Вы действительно хотите удалить сделку \"' + name + '\"?'))
        $.ajax({
            type: "PUT",
            url: `${api}/api/Deals/MakeInvisible/${id}`,
            success: function (data) {
                var table = $('#deals-table').DataTable();
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
            }
        });
};


function getNumberFromCurrency(value) {
    if (value === "" || value === 0)
        return 0;

    return Number(value.replace(/[^0-9,.\-]+/g, "").replace(",", ".").replace("₽", "").replace(" ", ""));
}

function FormatDate(data) {

    var date = new Date(data)
    var dd = date.getDate();
    var mm = date.getMonth() + 1;
    var yy = date.getFullYear();

    dd = checkTime(dd);
    mm = checkTime(mm);

    const resDate = dd + '-' + mm + '-' + yy;
    return resDate === "01-01-1970" ? "Не подписано" : resDate;
}

function checkTime(i) {
    if (i < 10)
        i = "0" + i;
    return i;
}

function Auto(e) {
    $(e).autoNumeric('init', { aSep: ' ', aDec: ',' });
}

function extendSortFunction() {

    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "ruDate-asc": function (a, b) {
            var ruDatea = $.trim(a).split('.');
            var ruDateb = $.trim(b).split('.');

            if (ruDatea[2] * 1 < ruDateb[2] * 1)
                return 1;
            if (ruDatea[2] * 1 > ruDateb[2] * 1)
                return -1;
            if (ruDatea[2] * 1 == ruDateb[2] * 1) {
                if (ruDatea[1] * 1 < ruDateb[1] * 1)
                    return 1;
                if (ruDatea[1] * 1 > ruDateb[1] * 1)
                    return -1;
                if (ruDatea[1] * 1 == ruDateb[1] * 1) {
                    if (ruDatea[0] * 1 < ruDateb[0] * 1)
                        return 1;
                    if (ruDatea[0] * 1 > ruDateb[0] * 1)
                        return -1;
                }
                else
                    return 0;
            }
        },

        "ruDate-desc": function (a, b) {
            var ruDatea = $.trim(a).split('.');
            var ruDateb = $.trim(b).split('.');

            if (ruDatea[2] * 1 < ruDateb[2] * 1)
                return -1;
            if (ruDatea[2] * 1 > ruDateb[2] * 1)
                return 1;
            if (ruDatea[2] * 1 == ruDateb[2] * 1) {
                if (ruDatea[1] * 1 < ruDateb[1] * 1)
                    return -1;
                if (ruDatea[1] * 1 > ruDateb[1] * 1)
                    return 1;
                if (ruDatea[1] * 1 == ruDateb[1] * 1) {
                    if (ruDatea[0] * 1 < ruDateb[0] * 1)
                        return -1;
                    if (ruDatea[0] * 1 > ruDateb[0] * 1)
                        return 1;
                }
                else
                    return 0;
            }
        }
    });
}