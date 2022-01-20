var organizationFilterValues = new Set();
var contactFilterValues = new Set();
var contactDateValues;

var InitializeFiltersForDealList = () => {



    $('#contract-date').datepicker({
        onSelect(formattedDate, date, inst) {

            if (formattedDate.length > 0) {
                if (date.length === 1) {
                    window.editFilterFunction('contract-date-filter',
                        (deal) => deal.contractSigningDate !== 'Неизвестная дата' &&
                            Date.parse(deal.contractSigningDateVal) >= date[0]);

                    window.Cookies.remove('contract-date-filter-to');
                    window.Cookies.remove('contract-date-filter-from');
                    window.Cookies.set('contract-date-filter-from', date[0], { expires: 60 });
                } else if (date.length === 2) {
                    window.editFilterFunction('contract-date-filter',
                        (deal) => deal.contractSigningDate !== 'Неизвестная дата' &&
                            Date.parse(deal.contractSigningDateVal) >= date[0] &&
                            Date.parse(deal.contractSigningDateVal) <= date[1]);

                    window.Cookies.remove('contract-date-filter-from');
                    window.Cookies.set('contract-date-filter-from', date[0], { expires: 60 });

                    window.Cookies.remove('contract-date-filter-to');
                    window.Cookies.set('contract-date-filter-to', date[1], { expires: 60 });
                }
            } else {
                window.Cookies.remove('contract-date-filter-to');
                window.Cookies.remove('contract-date-filter-from');
                window.removeFilter('contract-date-filter');
            }

            window.filterDeals();
        }
    });

    $('.datepicker-here').each(function () {
        $(this).keypress(function () {
            return false;
        });
        $(this).attr("autocomplete", "off");
    });

    if (window.Cookies.get('contract-date-filter-from') !== undefined &&
        window.Cookies.get('contract-date-filter-from') !== "") {

        var cookieFromVal = window.Cookies.get('contract-date-filter-from');
        var cookieDate = [];

        cookieDate[0] = new Date(cookieFromVal);

        if (window.Cookies.get('contract-date-filter-to') !== undefined &&
            window.Cookies.get('contract-date-filter-to') !== "") {

            var cookieToVal = window.Cookies.get('contract-date-filter-to');

            cookieDate[1] = new Date(cookieToVal);
        }

        var myDatepicker = $('#contract-date').datepicker().data('datepicker');

        myDatepicker.selectDate(cookieDate);
    }

    $.ajax({
        url: `${location.origin}/Organizations/GetActiveOrganizations`,
        success: function (data) {
            $.each(data, function (idx, a) {
                organizationFilterValues.add(a.id);
                var select = document.getElementById('organization-filter');
                $("#organization-filter").append(new Option(a.shortName, a.id));
                select.children[idx].setAttribute("data-tokens", a.fullName);

            });

            if ($("#organization-filter").val().length === 0)
                $("#organization-filter").val(null);

            $('#organization-filter').selectpicker('refresh');

            getCookiesMultipleSelect('organization-filter');

            $('#organization-filter option:selected').prependTo('#organization-filter');

            $('#organization-filter').selectpicker('refresh');
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/Contacts/Short`,
        success: function (data) {
            $.each(data, function (idx, a) {
                contactFilterValues.add(a.id);
                $("#contact-filter").append(new Option(a.displayName, a.id));

            });

            if ($("#contact-filter").val().length === 0)
                $("#contact-filter").val(null);

            $('#contact-filter').selectpicker('refresh');

            getCookiesSingleSelect('contact-filter');

            $('#contact-filter option:selected').prependTo('#contact-filter');
            $('#contact-filter').selectpicker('refresh');
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Deals/DealStatuses`,
        success: function (data) {
            let activeDealStatus;
            $.each(data, function (idx, a) {

                $("#status-filter").append(new Option(a.name, a.id));

                if (a.name === "Активная")
                    activeDealStatus = a.id;
            });

            if ($("#status-filter").val().length === 0)
                $("#status-filter").val(null);

            $('#status-filter').selectpicker('refresh');

            if (!ignoreActive)
                $('#status-filter').selectpicker('val', activeDealStatus);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    if (isTop)
        $.ajax({
            url: `${api}/api/GetActiveDepartments`,
            success: function (data) {
                $.each(data, function (idx, a) {

                    $("#department-sales-filter").append(new Option(a.name, a.id));
                    $("#department-industrial-filter").append(new Option(a.name, a.id));

                });

                if ($("#department-sales-filter").val().length === 0)
                    $("#department-sales-filter").val(null);

                if ($("#department-industrial-filter").val().length === 0)
                    $("#department-industrial-filter").val(null);

                $('#department-sales-filter').selectpicker('refresh');
                $('#department-industrial-filter').selectpicker('refresh');

                getCookiesMultipleSelect('department-sales-filter');
                getCookiesMultipleSelect('department-industrial-filter');

                $('#department-sales-filter option:selected').prependTo('#department-sales-filter');

                $('#department-sales-filter').selectpicker('refresh');

                $('#department-industrial-filter option:selected').prependTo('#department-industrial-filter');

                $('#department-industrial-filter').selectpicker('refresh');

                var departmentCount = $('#department-sales-filter option:selected').length +
                    $('#department-industrial-filter option:selected').length;

                if(departmentCount !== 0)
                    $('#department-button').text("Выбрано " + departmentCount + " департаментов");

                window.InitTippyWindows();
            },
            xhrFields: {
                withCredentials: true
            }
        });
    else
        window.InitTippyWindows();

    if (isTop)
        $.ajax({
            url: `${api}/api/Departments/GetSalesDepartment`,
            success: function (data) {
                $.each(data, function (idx, a) {
                    $("#sales-office-filter").append(new Option(a.name, a.id));
                })

                if ($("#sales-office-filter").val().length === 0)
                    $("#sales-office-filter").val(null);

                $('#sales-office-filter').selectpicker('refresh');

                $('#sales-office-filter').on("change.select2",
                    function(e) {
                        getSalesUsers($('#sales-office-filter').val());
                    });

                getCookiesMultipleSelect('sales-office-filter');

                getSalesUsers($('#sales-office-filter').val());

                $('#sales-office-filter option:selected').prependTo('#sales-office-filter');

                $('#sales-office-filter').selectpicker('refresh');

            },
            xhrFields: {
                withCredentials: true
            }
        });

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            $.each(data, function (idx, a) {

                $("#responsible-product-filter").append(new Option(a.displayName, a.id));
                $("#responsible-mp-filter").append(new Option(a.displayName, a.id));

            });

            if ($("#responsible-mp-filter").val().length === 0)
                $("#responsible-mp-filter").val(null);

            if ($("#responsible-product-filter").val().length === 0)
                $("#responsible-product-filter").val(null);

            $('#responsible-mp-filter').selectpicker('refresh');
            $('#responsible-product-filter').selectpicker('refresh');

            getCookiesSingleSelect('responsible-mp-filter');
            getCookiesSingleSelect('responsible-product-filter');

            $('#responsible-mp-filter option:selected').prependTo('#responsible-mp-filter');
            $('#responsible-mp-filter').selectpicker('refresh');

            $('#responsible-product-filter option:selected').prependTo('#responsible-product-filter');
            $('#responsible-product-filter').selectpicker('refresh');

        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Deals/DealSteps`,
        success: function (data) {
            $.each(data, function (idx, a) {

                $("#step-filter").append(new Option(a.name, a.id));

            });

            if ($("#step-filter").val().length === 0)
                $("#step-filter").val(null);

            $('#step-filter').selectpicker('refresh');

            getCookiesMultipleSelect('step-filter');

            $('#step-filter option:selected').prependTo('#step-filter');

            $('#step-filter').selectpicker('refresh');

        },
        xhrFields: {
            withCredentials: true
        }
    });

    if (!isTop && isDepHeader)
        getSalesUsers();
};

function getSalesUsers(departmentIds) {
    //let departmentIdOrder = "?departmentIdOrder=";
    //if (departmentIds && Array.isArray(departmentIds)) {
    //    departmentIdOrder = departmentIds.map(o => `departmentIdOrder=${o}`).join("&");
    //}
    let userId = user.id;

    $.ajax({
        url: `${api}/api/Users/GetSalesUsers/${userId}`,
        success: function (data) {
            $("#sale-filter").empty();

            $.each(data, function (idx, a) {
                $("#sale-filter").append(new Option(a.displayName, a.id));
            });

            if ($("#sale-filter").val().length === 0)
                $("#sale-filter").val(null);

            $('#sale-filter').selectpicker('refresh');

            getCookiesMultipleSelect('sale-filter');

            $('#sale-filter option:selected').prependTo('#sale-filter');

            $('#sale-filter').selectpicker('refresh');
        },
        xhrFields: {
            withCredentials: true
        }
    });
}

var deleteMarginFields = fieldType => {
    $('#' + fieldType + '-margin-from').val('');
    $('#' + fieldType + '-margin-to').val('');
    $(filterElementsMap.get(fieldType + '-margin-to')).removeClass('checked-filter');
};

var getCookiesMultipleSelect = (selectName) => {

    if (window.Cookies.get(selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get(selectName).split(',');
    var filterVal = $('#' + selectName).val();
    var eq = cookieVal.length === filterVal.length && cookieVal.every((e, i) => e === filterVal[i]);

    if (cookieVal !== [] && cookieVal[0] !== "" && !eq) {
        $(filterElementsMap.get(selectName)).addClass('checked-filter');
        $('#' + selectName).selectpicker('val', cookieVal);
    }
};

var getCookiesSingleSelect = (selectName) => {

    if (window.Cookies.get(selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get(selectName);
    var filterVal = $('#' + selectName).val();
    var eq = filterVal === cookieVal;

    if (cookieVal !== undefined && cookieVal !== "" && !eq) {
        $(filterElementsMap.get(selectName)).addClass('checked-filter');
        $('#' + selectName).selectpicker('val', cookieVal);
    }
};