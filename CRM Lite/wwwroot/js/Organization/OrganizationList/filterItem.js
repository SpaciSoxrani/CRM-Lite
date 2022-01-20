var filterFunctions = new Map();

var filterOrganizations = () => {

    var filteredOrganizations = window.organizationData.slice();

    for (var [key, filterFunction] of filterFunctions) {
        filteredOrganizations = filteredOrganizations.filter(org => filterFunction(org));
    }

    table.clear();
    table.rows.add(filteredOrganizations);
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
    $("#status-filter").val(null).selectpicker('refresh');
    $("#industry-filter").val(null).selectpicker('refresh');
    $("#relationship-filter").val(null).selectpicker('refresh');
    $("#city").val("");
    $("#city").removeClass('checked-filter');

    table
        .columns(-1)
        .search('');

    table.search('');

    filterOrganizations();
};

var initializeStartedOrganizations = (orgs) => {

    for (var [key, filterFunction] of filterFunctions) {
        orgs = orgs.filter(org => filterFunction(org));
    }

    return orgs;
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
                (org) => cookieSalesOfficeVal.some(o => o === org.salesOfficeId));
        else
            window.removeFilter('sales-office-filter');
    }

    if (window.Cookies.get('sale-filter') !== undefined && window.Cookies.get('sale-filter') !== "") {

        var cookieSaleVal = window.Cookies.get('sale-filter').split(',');

        if (cookieSaleVal.length > 0)
            editFilterFunction('sale-filter',
                (org) => cookieSaleVal.some(o => o === org.responsibleUserId));
        else
            window.removeFilter('sale-filter');
    }

    if (window.Cookies.get('status-filter') !== undefined && window.Cookies.get('status-filter') !== "") {

        var cookieStatusVal = window.Cookies.get('status-filter').split(',');

        if (cookieStatusVal.length > 0)
            editFilterFunction('status-filter',
                (org) => cookieStatusVal.some(o => o === org.isActive));
        else
            window.removeFilter('status-filter');
    }

    if (window.Cookies.get('industry-filter') !== undefined && window.Cookies.get('industry-filter') !== "") {

        var cookieIndustryVal = window.Cookies.get('industry-filter').split(',');

        if (cookieIndustryVal.length > 0)
            editFilterFunction('industry-filter',
                (org) => cookieIndustryVal.some(o => o === org.industryId));
        else
            window.removeFilter('industry-filter');
    }

    if (window.Cookies.get('relationship-filter') !== undefined && window.Cookies.get('relationship-filter') !== "") {

        var cookieRelationshipVal = window.Cookies.get('relationship-filter').split(',');

        if (cookieRelationshipVal.length > 0)
            editFilterFunction('relationship-filter',
                (org) => cookieRelationshipVal.some(o => o === org.relationshipId));
        else
            window.removeFilter('relationship-filter');
    }

    if (window.Cookies.get('city-filter') !== undefined && window.Cookies.get('city-filter') !== "") {

        var cookieСityVal = window.Cookies.get('city-filter');

        if (cookieСityVal.length > 0)
            editFilterFunction('city-filter',
                (org) => org.city.contains(cookieСityVal));
        else
            window.removeFilter('city-filter');
    }
};

function ClearFilterCookies() {
    window.Cookies.remove('sales-office-filter');
    window.removeFilter('sales-office-filter');

    window.Cookies.remove('sale-filter');
    window.removeFilter('sale-filter');

    window.Cookies.remove('status-filter');
    window.removeFilter('status-filter');

    window.Cookies.remove('industry-filter');
    window.removeFilter('industry-filter');

    window.Cookies.remove('relationship-filter');
    window.removeFilter('relationship-filter');

    window.Cookies.remove('city-filter');
    window.removeFilter('city-filter');
};