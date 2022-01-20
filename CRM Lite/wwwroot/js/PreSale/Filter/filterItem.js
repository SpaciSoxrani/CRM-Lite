var filterFunctions = new Map();

function filterItems() {
    if(window.preSaleGroupId)
        initializePreSalesResponsibleUserFilter(window.contactData);

    var filteredItems = window.contactData.slice();

    for (var [key, filterFunction] of filterFunctions) {
        filteredItems = filteredItems.filter(item => filterFunction(item));
    }

    table.clear();
    table.rows.add(filteredItems);
    table.draw();
}

function removeFilter(key) {
    $(filterElementsMap.get(key)).removeClass('checked-filter');
    filterFunctions.delete(key);
}

function removePreSalesAllFilters() {
    clearPreSalesFilterCookies();

    $("#region-filter").val(null).selectpicker('refresh');
    $("#pre-sale-status-filter").val(null).selectpicker('refresh');
    $("#responsible-user-filter").val(null).selectpicker('refresh');

    tableReload();
}

function clearPreSalesFilterCookies() {
    window.Cookies.remove('region-filter');
    window.removeFilter('region-filter');

    window.Cookies.remove('pre-sale-status-filter');
    window.removeFilter('pre-sale-status-filter');

    window.Cookies.remove('responsible-user-filter');
    window.removeFilter('responsible-user-filter');
}

function removePreSaleGroupsAllFilters() {
    clearPreSaleGroupsFilterCookies();

    $("#pre-sale-group-status").val(null).selectpicker('refresh');
    $("#sales-office-filter").val(null).selectpicker('refresh');

    tableReload();
}

function clearPreSaleGroupsFilterCookies() {
    window.Cookies.remove('pre-sale-group-status');
    window.removeFilter('pre-sale-group-status');

    window.Cookies.remove('sales-office-filter');
    window.removeFilter('sales-office-filter');
}

function tableReload() {
    table.columns(-1).search('');

    table.search('');

    filterItems();
}