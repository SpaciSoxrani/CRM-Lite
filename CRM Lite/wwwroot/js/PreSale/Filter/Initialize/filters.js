function initializePreSalesFilters(data) {
    $.ajax({
        url: `${api}/api/PreSales/PreSaleRegions`,
        success: function (data) {
            window.preSaleRegions = data;
            $.each(data,
                function (idx, a) {
                    $('#region-filter').append(new Option(a.name, a.id));
                });

            if ($("#region-filter").val().length === 0)
                $("#region-filter").val(null);

            $('#region-filter').selectpicker('refresh');

            getCookiesMultipleSelect('region-filter');

            $('#region-filter option:selected').prependTo('#region-filter');

            $('#region-filter').selectpicker('refresh');
        }
    });

    $.ajax({
        url: `${api}/api/PreSales/PreSaleStatuses`,
        success: function (data) {
            $.each(data,
                function (idx, a) {
                    $("#pre-sale-status-filter").append(new Option(a.name, a.id));
                });

            if ($("#pre-sale-status-filter").val().length === 0)
                $("#pre-sale-status-filter").val(null);

            $('#pre-sale-status-filter').selectpicker('refresh');

            getCookiesMultipleSelect('pre-sale-status-filter');

            $('#pre-sale-status-filter option:selected').prependTo('#pre-sale-status-filter');

            $('#pre-sale-status-filter').selectpicker('refresh');

        }
    });

    initializePreSalesResponsibleUserFilter(data);
}

function initializePreSalesResponsibleUserFilter(data) {
    $("#responsible-user-filter").empty();

    var responsibleUsers = [];
    $.each(data, function (idx, a) {
        if (a.responsibleUser && !responsibleUsers.find(item => item == a.responsibleUserId)) {
            $("#responsible-user-filter").append(new Option(a.responsibleUser, a.responsibleUserId));
            responsibleUsers.push(a.responsibleUserId);
        }
    });

    if ($("#responsible-user-filter").val().length === 0)
        $("#responsible-user-filter").val(null);

    $('#responsible-user-filter').selectpicker('refresh');

    getCookiesMultipleSelect('responsible-user-filter');

    $('#responsible-user-filter option:selected').prependTo('#responsible-user-filter');

    $('#responsible-user-filter').selectpicker('refresh');
}

function initializePreSaleGroupsFilters() {
    $.ajax({
        url: `${api}/api/PreSales/PreSaleGroupStatuses`,
        success: function (data) {
            $.each(data,
                function (idx, a) {
                    $('#pre-sale-group-status').append(new Option(a.name, a.id));
                });

            if ($("#pre-sale-group-status").val().length === 0)
                $("#pre-sale-group-status").val(null);

            $('#pre-sale-group-status').selectpicker('refresh');

            getCookiesMultipleSelect('pre-sale-group-status');

            $('#pre-sale-group-status option:selected').prependTo('#pre-sale-group-status');

            $('#pre-sale-group-status').selectpicker('refresh');
        }
    });

    $.ajax({
        url: `${api}/api/Departments/MainDepartments`,
        success: function (data) {
            $.each(data,
                function (idx, a) {
                    $("#sales-office-filter").append(new Option(a.name, a.id));
                });

            if ($("#sales-office-filter").val().length === 0)
                $("#sales-office-filter").val(null);

            $('#sales-office-filter').selectpicker('refresh');

            getCookiesMultipleSelect('sales-office-filter');

            $('#sales-office-filter option:selected').prependTo('#sales-office-filter');

            $('#sales-office-filter').selectpicker('refresh');

        }
    });
}

function getCookiesMultipleSelect(selectName) {

    if (window.Cookies.get(selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get(selectName).split(',');
    var filterVal = $('#' + selectName).val();
    var eq = cookieVal.length === filterVal.length && cookieVal.every((e, i) => e === filterVal[i]);

    if (cookieVal !== [] && cookieVal[0] !== "" && !eq) {
        $(filterElementsMap.get(selectName)).addClass('checked-filter');
        $('#' + selectName).selectpicker('val', cookieVal);
    }
}