var filterFunctions = new Map();

function filterItems() {
    initializeLeadsResponsibleUserFilter(window.contactData)

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

function removeLeadsAllFilters() {
    clearLeadsFilterCookies();

    $("#target-filter").val(null).selectpicker('refresh');
    $("#status-filter").val(null).selectpicker('refresh');
    $("#project-filter").val(null).selectpicker('refresh');
    $("#upload-date").val(null);
    $("#responsible-user-filter").val(null).selectpicker('refresh');

    tableReload();
}

function clearLeadsFilterCookies() {
    window.Cookies.remove('responsible-user-filter');
    window.removeFilter('responsible-user-filter');
    window.Cookies.remove('target-filter');
    window.removeFilter('target-filter');
    window.Cookies.remove('status-filter');
    window.removeFilter('status-filter');
    window.Cookies.remove('project-filter');
    window.removeFilter('project-filter');
    window.Cookies.remove('upload-date-filter-to');
    window.Cookies.remove('upload-date-filter-from');
    window.removeFilter('upload-date-filter');
    window.removeFilter('upload-date-filter-from');
}

function tableReload() {
    table.columns(-1).search('');

    table.search('');

    filterItems();
}