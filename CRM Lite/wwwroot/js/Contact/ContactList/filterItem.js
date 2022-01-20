var filterFunctions = new Map();

var filterContacts = () => {

    var filteredContacts = window.contactData.slice();

    for (var [key, filterFunction] of filterFunctions) {
        filteredContacts = filteredContacts.filter(org => filterFunction(org));
    }

    table.clear();
    table.rows.add(filteredContacts);
    table.draw();
};

var removeFilter = (key) => {
    $(filterElementsMap.get(key)).removeClass('checked-filter');
    filterFunctions.delete(key);
};

var removeAllFilters = () => {
    ClearFilterCookies();

    $("#sales-office-filter").val(null).selectpicker('refresh');
    $("#sale-filter").val(null).selectpicker('refresh');
    $("#gender-filter").val(null).selectpicker('refresh');
    $("#role-filter").val(null).selectpicker('refresh');
    $("#organization-filter").val(null).selectpicker('refresh');
    $("#city").val("");
    $("#city").removeClass('checked-filter');

    table
        .columns(-1)
        .search('');

    table.search('');

    filterContacts();
};

var initializeStartedContacts = (contacts) => {

    for (var [key, filterFunction] of filterFunctions) {
        contacts = contacts.filter(contact => filterFunction(contact));
    }

    return contacts;
};

var editFilterFunction = (functionName, filterFunction) => {
    filterFunctions.set(functionName, filterFunction);
    $(filterElementsMap.get(functionName)).addClass('checked-filter');
};

var initializeFilterFunctions = () => {

    if (window.Cookies.get('sales-office-filter') !== undefined && window.Cookies.get('sales-office-filter') !== "") {

        var cookieSalesOfficeVal = window.Cookies.get('sales-office-filter').split(',');

        if (cookieSalesOfficeVal.length > 0)
            editFilterFunction('sales-office-filter',
                (cont) => cookieSalesOfficeVal.some(o => o === cont.salesOfficeId));
        else
            window.removeFilter('sales-office-filter');
    }

    if (window.Cookies.get('sale-filter') !== undefined && window.Cookies.get('sale-filter') !== "") {

        var cookieSaleVal = window.Cookies.get('sale-filter').split(',');

        if (cookieSaleVal.length > 0)
            editFilterFunction('sale-filter',
                (cont) => cookieSaleVal.some(o => o === cont.responsibleUserId));
        else
            window.removeFilter('sale-filter');
    }

    if (window.Cookies.get('gender-filter') !== undefined && window.Cookies.get('gender-filter') !== "") {

        var cookieGenderVal = window.Cookies.get('gender-filter').split(',');

        if (cookieGenderVal.length > 0)
            editFilterFunction('gender-filter',
                (cont) => cookieGenderVal.some(o => o === cont.genderId));
        else
            window.removeFilter('gender-filter');
    }

    if (window.Cookies.get('role-filter') !== undefined && window.Cookies.get('role-filter') !== "") {

        var cookieRoleVal = window.Cookies.get('role-filter').split(',');

        if (cookieRoleVal.length > 0)
            editFilterFunction('role-filter',
                (cont) => cookieRoleVal.some(o => o === cont.roleId));
        else
            window.removeFilter('role-filter');
    }

    if (window.Cookies.get('organization-filter') !== undefined && window.Cookies.get('organization-filter') !== "") {

        var cookieOrganizationVal = window.Cookies.get('organization-filter').split(',');

        if (cookieOrganizationVal.length > 0)
            editFilterFunction('organization-filter',
                (cont) => cookieOrganizationVal.some(o => o === cont.organizationId));
        else
            window.removeFilter('organization-filter');
    }

    if (window.Cookies.get('city-filter') !== undefined && window.Cookies.get('city-filter') !== "") {

        var cookieСityVal = window.Cookies.get('city-filter');

        if (cookieСityVal.length > 0)
            editFilterFunction('city-filter',
                (cont) => cont.city.contains(cookieСityVal));
        else
            window.removeFilter('city-filter');
    }
};

function ClearFilterCookies() {
    window.Cookies.remove('sales-office-filter');
    window.removeFilter('sales-office-filter');

    window.Cookies.remove('sale-filter');
    window.removeFilter('sale-filter');

    window.Cookies.remove('gender-filter');
    window.removeFilter('gender-filter');

    window.Cookies.remove('role-filter');
    window.removeFilter('role-filter');

    window.Cookies.remove('organization-filter');
    window.removeFilter('organization-filter');

    window.Cookies.remove('city-filter');
    window.removeFilter('city-filter');
};