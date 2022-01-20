var isDatatableInitialized = false;
var date_from = new Date().toISOString();
var date_to = new Date().toISOString();

$(document).ready(function () {
    document.querySelector('body').classList.add('sidebar-hidden');
    var statementsStartDatePicker = $('#statement-date-from').datepicker({
        todayButton: new Date(),
        autoClose: true,

        onSelect: function (formattedDate, date, inst) {
            if (date === "")
                statementsEndDateData.update('minDate', '');
            else
                statementsEndDateData.update('minDate', date);

        }
    });

    var statementsStartDateData = statementsStartDatePicker.datepicker().data('datepicker');

    var statementsEndDatePicker = $('#statement-date-to').datepicker({
        todayButton: new Date(),
        autoClose: true,

        onSelect: function (formattedDate, date, inst) {
            if (date === "")
                statementsStartDateData.update('maxDate', '');
            else
                statementsStartDateData.update('maxDate', date);

        }
    });

    var statementsEndDateData = statementsEndDatePicker.datepicker().data('datepicker');

    // BLOCK TEXT INPUT AND AUTOCOMPLETE

    $('.datepicker-here').each(function () {
        $(this).keypress(function () {
            return false;
        });
        $(this).attr("autocomplete", "off");
    });
    $('#statement').wrap('<div class="scrollStyle"></div>');
    initializeDataTable();

});

let stepNumberMap = new Map([
    ['Верификация потребности', 1],
    ['Разработка проекта технического решения', 2],
    ['Согласование решения', 3],
    ['Конкурсная процедура', 4],
    ['Подписание контракта', 5],
    ['Работа по контракту', 6],
    ['Контракт закрыт', 7]
]);

var initializeDataTable = () => {
    var dataTable = $('#statement').DataTable({
        dom: "Bfrtip",
        responsive: false,
        ajax: {
            url: `${api}/api/Deals/GetStatements?isPlan=${window.isPlan}`,
            type: "GET",
            dataSrc: function (json) {
                json.map((p) => {
                    p.enterBudget = thousandSeparator(p.enterBudget);
                    p.estimatedBudget = thousandSeparator(p.estimatedBudget);
                    p.estimatedMargin = thousandSeparator(p.estimatedMargin);
                    p.estimatedRealMargin = thousandSeparator(p.estimatedRealMargin);
                    p.averageMargin = thousandSeparator(p.averageMargin);

                    if (p.salesUnitName === "ТОП-менеджмент")
                        p.salesUnitName = "ТОП";
                });

                $.LoadingOverlay("hide");
                return json;
            }
        },
        rowCallback: function (row, data, index) {
            var stepName = data.stepName;

            if (stepName === 'Работа по контракту')
                $(row).css('background-color', '#86EEA1');
        },
        buttons: [
            {
                extend: 'colvis',
                text: 'Показать/скрыть столбцы',
                collectionLayout: 'fixed two-column'
            },
            {
                extend: 'excelHtml5',
                text: 'Экспорт в Excel',
                className: 'btn-success',
                autoFilter: true,
                sheetName: 'Отчёт по сделкам',
                exportOptions: {
                    format: {
                        body: function (data, row, column, node) {
                            // Strip $ from salary column to make it numeric
                            return data.toString().includes("₽") ?
                                getNumberFromCurrency(data) :
                                data;
                        }
                    }
                },
                customize: customizeExcelOptions
            }
        ],
        "language": {
            url: "/lib/datatables/datatables.language.russian.json"
        },
        "columns": [
            { "data": "salesUnitName" },
            { "data": "responsibleName" },
            { "data": "organizationName" },
            {
                "data": "dealName",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return data.replace(/\"/g, '');
                    return data;
                }
            },
            {
                "data": "shortDealName",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return data.replace(/\"/g, '');
                    return data;
                }
            },
            { "data": "productLineName" },
            {
                "data": "stepName",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return stepNumberMap.get(data);
                    return data;
                }
            },
            { "data": "dealStatusName" },
            { "data": "creationDate" },
            { "data": "contractSigningDate" },
            { "data": "contractClosureDate" },
            { "data": "changedDate" },
            { "data": "salesDepartmentName" },
            { "data": "probability" },
            {
                "data": "enterBudget",
                "type": "num-fmt",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "estimatedBudget",
                "type": "num-fmt",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "estimatedMargin",
                "type": "num-fmt",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "estimatedRealMargin",
                "type": "num-fmt",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "averageMargin",
                "type": "num-fmt",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            { "data": "salesDepartmentName" },
            { "data": "industrialDepartmentName" },
            { "data": "dealClassName" },
            { "data": "comments" }
    ],
        "order": [[0, "desc"], [1, "asc"], [5, "asc"], [13, "asc"]]
    });
};

function getNumberFromCurrency(value) {
    return Number(value.replace(/[^0-9,.\-]+/g, "").replace(",", ".").replace("₽", "").replace(" ", ""));
}

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

var customizeExcelOptions = (xlsx) => {
    var sheet = xlsx.xl.worksheets['sheet1.xml'];

    var styles = xlsx.xl['styles.xml'];

    //Add 3 colors
    var addCount = 3;

    var fillscount = +$('fills', styles).attr('count');
    $('fills', styles).attr('count', addCount + fillscount + '');
    var cellXfscount = +$('cellXfs', styles).attr('count');
    $('cellXfs', styles).attr('count', addCount + cellXfscount + '');


    var fills = $('fills', styles)[0];
    var cellXfs = $('cellXfs', styles)[0];
    var namespace = styles.lookupNamespaceURI(null);

    //Green, blue, red
    var bgcolorArray = ['#86EEA1', '#63c2de', '#FFFFFF'];

    for (var i = 0; i < bgcolorArray.length; i++) {
        createColor(bgcolorArray[i], namespace, styles, fills, cellXfs, fillscount, i);
    }

    $('row:nth-child(2) c', sheet).attr('s', (cellXfscount + 1) + '');

    $('row c[r^="F"] t', sheet).each(function() {
        if ($(this).text() === 'Работа по контракту') {
            $(this).closest('row').children('c').attr('s', (cellXfscount + 0) + '');
        } else {
            $(this).closest('row').children('c').attr('s', (cellXfscount + 2) + '');
        }
    });
};

var createColor = (color, namespace, styles, fills, cellXfs, fillscount, i) => {
    var bgcolor = color;
    var fill = styles.createElementNS(namespace, 'fill');
    var patternFill = styles.createElementNS(namespace, 'patternFill');
    patternFill.setAttribute("patternType", "solid");
    var fgColor = styles.createElementNS(namespace, 'fgColor');
    fgColor.setAttribute("rgb", bgcolor.substring(1));
    var bgColor = styles.createElementNS(namespace, 'bgColor');
    bgColor.setAttribute("indexed", "64");
    patternFill.appendChild(fgColor);
    patternFill.appendChild(bgColor);
    fill.appendChild(patternFill);
    fills.appendChild(fill);

    var xf = styles.createElementNS(namespace, 'xf');
    xf.setAttribute("numFmtId", "4");
    xf.setAttribute("fontId", "0");
    xf.setAttribute("fillId", "" + (fillscount + i));
    xf.setAttribute("borderId", "0");
    xf.setAttribute("applyFont", "1");
    xf.setAttribute("applyFill", "1");
    xf.setAttribute("applyBorder", "1");
    cellXfs.appendChild(xf);
};
