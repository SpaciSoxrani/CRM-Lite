

var InitializeFiltersForContList = () => {


    $.ajax({
        url: `${api}/api/Departments/GetSalesDepartment`,
        success: function (data) {
            $.each(data,
                function (idx, a) {
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

    $.ajax({
        url: `${api}/api/Genders`,
        success: function (data) {
            $.each(data, function (idx, a) {

                $("#gender-filter").append(new Option(a.name, a.id));

            });

            if ($("#gender-filter").val().length === 0)
                $("#gender-filter").val(null);

            $('#gender-filter').selectpicker('refresh');

            getCookiesMultipleSelect('gender-filter');

            $('#gender-filter option:selected').prependTo('#gender-filter');

            $('#gender-filter').selectpicker('refresh');

        }
    });

    $.ajax({
        url: `${location.origin}/Organizations/GetActiveOrganizations`,
        success: function (data) {
            $.each(data, function (idx, a) {

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
        }
    });

    $.ajax({
        url: `${api}/api/ContactRoles`,
        success: function (data) {
            $.each(data, function (idx, a) {

                $("#role-filter").append(new Option(a.name, a.id));

            });

            if ($("#role-filter").val().length === 0)
                $("#role-filter").val(null);

            $('#role-filter').selectpicker('refresh');

            getCookiesMultipleSelect('role-filter');

            $('#role-filter option:selected').prependTo('#role-filter');

            $('#role-filter').selectpicker('refresh');

        }
    });
}

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