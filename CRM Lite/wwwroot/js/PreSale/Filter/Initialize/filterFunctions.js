function initializePreSalesFilterFunctions() {

    if (window.Cookies.get('region-filter') !== undefined && window.Cookies.get('region-filter') !== "") {

        var cookieRegionVal = window.Cookies.get('region-filter').split(',');

        if (cookieRegionVal.length > 0)
            editFilterFunction('region-filter',
                (cont) => cookieRegionVal.some(o => o === cont.regionId));
        else
            window.removeFilter('region-filter');
    }

    if (window.Cookies.get('pre-sale-status-filter') !== undefined && window.Cookies.get('pre-sale-status-filter') !== "") {

        var cookiePreSaleStatusVal = window.Cookies.get('pre-sale-status-filter').split(',');

        if (cookiePreSaleStatusVal.length > 0)
            editFilterFunction('pre-sale-status-filter',
                (cont) => cookiePreSaleStatusVal.some(o => o === cont.statusId));
        else
            window.removeFilter('pre-sale-status-filter');
    }

    if (window.Cookies.get('responsible-user-filter') !== undefined && window.Cookies.get('responsible-user-filter') !== "") {

        var cookieResponsibleUserVal = window.Cookies.get('responsible-user-filter').split(',');

        if (cookieResponsibleUserVal.length > 0)
            editFilterFunction('responsible-user-filter',
                (cont) => cookieResponsibleUserVal.some(o => o === cont.responsibleUserId));
        else
            window.removeFilter('responsible-user-filter');
    }
}

function initializePreSaleGroupsFilterFunctions() {

    if (window.Cookies.get('pre-sale-group-status') !== undefined && window.Cookies.get('pre-sale-group-status') !== "") {

        var cookiePreSaleGroupStatusVal = window.Cookies.get('pre-sale-group-status').split(',');

        if (cookiePreSaleGroupStatusVal.length > 0)
            editFilterFunction('pre-sale-group-status',
                (cont) => cookiePreSaleGroupStatusVal.some(o => o === cont.statusId));
        else
            window.removeFilter('pre-sale-group-status');
    }

    if (window.Cookies.get('sales-office-filter') !== undefined && window.Cookies.get('sales-office-filter') !== "") {

        var cookieSalesOfficeVal = window.Cookies.get('sales-office-filter').split(',');

        if (cookieSalesOfficeVal.length > 0)
            editFilterFunction('sales-office-filter',
                (cont) => cookieSalesOfficeVal.some(o => o === cont.departmentId));
        else
            window.removeFilter('sales-office-filter');
    }
}

function editFilterFunction(functionName, filterFunction) {
    filterFunctions.set(functionName, filterFunction);
    $(filterElementsMap.get(functionName)).addClass('checked-filter');
}