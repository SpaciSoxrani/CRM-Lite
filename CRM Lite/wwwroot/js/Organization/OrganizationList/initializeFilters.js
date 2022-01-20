

var InitializeFiltersForOrgList = () => {

    $.ajax({
        url: `${api}/api/Departments/GetSalesDepartment`,
        success: function (data) {
            $.each(data,
                function(idx, a) {
                    $("#sales-office-filter").append(new Option(a.name, a.id));
                });

            if ($("#sales-office-filter").val().length === 0)
                $("#sales-office-filter").val(null);

            $('#sales-office-filter').selectpicker('refresh');

            getCookiesMultipleSelect('sales-office-filter');

            getSalesUsers();

            $('#sales-office-filter option:selected').prependTo('#sales-office-filter');

            $('#sales-office-filter').selectpicker('refresh');

        }
    });

    getSalesUsers();

    $('#city').on('keyup',
        function () {
            if (this.value !== "")
                $(filterElementsMap.get('city')).addClass('checked-filter');
            else
                $(filterElementsMap.get('city')).removeClass('checked-filter');

            table
                .columns(-1)
                .search(this.value)
                .draw();
        });

    $.ajax({
        url: `${api}/api/Industries`,
        success: function(data) {
            $.each(data,
                function(idx, a) {

                    $("#industry-filter").append(new Option(a.name, a.id));

                });

            if ($("#industry-filter").val().length === 0)
                $("#industry-filter").val(null);

            $('#industry-filter').selectpicker('refresh');

            getCookiesMultipleSelect('industry-filter');

            $('#industry-filter option:selected').prependTo('#industry-filter');

            $('#industry-filter').selectpicker('refresh');

        }
    });

    $.ajax({
        url: `${api}/api/Relationships`,
        success: function(data) {
            $.each(data,
                function(idx, a) {

                    $("#relationship-filter").append(new Option(a.name, a.id));

                });

            if ($("#relationship-filter").val().length === 0)
                $("#relationship-filter").val(null);

            $('#relationship-filter').selectpicker('refresh');

            getCookiesMultipleSelect('relationship-filter');

            $('#relationship-filter option:selected').prependTo('#relationship-filter');

            $('#relationship-filter').selectpicker('refresh');

        }
    });
};

function getSalesUsers() {

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/ResponsibleForContactOrOrganization`,
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