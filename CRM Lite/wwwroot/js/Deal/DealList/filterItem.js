var filterFunctions = new Map();

var filterDeals = () => {

    var filteredDeals = window.dealsData.slice();

    for (var [key, filterFunction] of filterFunctions) {
        filteredDeals = filteredDeals.filter(deal => filterFunction(deal));
    }

    table.clear();
    table.rows.add(filteredDeals);
    table.draw();
};

var removeFilter = (key) => {
    $(filterElementsMap.get(key)).removeClass('checked-filter');
    filterFunctions.delete(key);
};

var removeAllFilters = () => {
    ClearFilterCookies();

    $("#organization-filter").val(null).selectpicker('refresh');
    $("#contact-filter").val(null).selectpicker('refresh');
    $("#sales-office-filter").val(null).selectpicker('refresh');
    $("#sale-filter").val(null).selectpicker('refresh');
    $("#contract-date").val(null);
    $("#responsible-product-filter").val(null).selectpicker('refresh');
    $("#responsible-mp-filter").val(null).selectpicker('refresh');
    $("#step-filter").val(null).selectpicker('refresh');
    $('#department-button').text("Департамент");

    $("#status-filter").val(() => {
        var activeEl = $("#status-filter option").filter((i, e) => e.text === "Активная");
        return activeEl.val();
    }).selectpicker('refresh');

    table.search('');

    $($('#expected-margin-button')[0]._tippy.props.content).find('#expected-margin-from').val('0.00 ₽').trigger('change');
    $($('#expected-margin-button')[0]._tippy.props.content).find('#expected-margin-to').val('0.00 ₽').trigger('change');
    $($('#expert-margin-button')[0]._tippy.props.content).find('#expert-margin-to').val('0.00 ₽').trigger('change');
    $($('#expert-margin-button')[0]._tippy.props.content).find('#expert-margin-from').val('0.00 ₽').trigger('change');

    if (isTop || isDepHeader) {
        $($('#department-button')[0]._tippy.props.content).find('#department-sales-filter').val(null)
            .selectpicker('refresh');
        $($('#department-button')[0]._tippy.props.content).find('#department-industrial-filter').val(null)
            .selectpicker('refresh');
    }

    $('#expected-margin-button').text(`Предполагаемая маржа`);
    $('#expert-margin-button').text(`Экспертная маржа`);

    filterDeals();
};

var initializeStartedDeals = (deals) => {

    for (var [key, filterFunction] of filterFunctions) {
        deals = deals.filter(deal => filterFunction(deal));
    }

    return deals;
};

var editFilterFunction = (functionName, filterFunction) => {
    filterFunctions.set(functionName, filterFunction);
    $(filterElementsMap.get(functionName)).addClass('checked-filter');
};

var initializeFilterFunctions = () => {
    if (window.Cookies.get('organization-filter')) {

        var cookieOrgVal = window.Cookies.get('organization-filter').split(',');

        if (cookieOrgVal.length > 0)
            editFilterFunction('organization-filter',
                (deal) => cookieOrgVal.some(o => o === deal.organizationId));
        else
            window.removeFilter('organization-filter');
    }

    if (window.Cookies.get('contact-filter')) {

        var cookieContactVal = window.Cookies.get('contact-filter');

        if (cookieContactVal.length > 0)
            editFilterFunction('contact-filter',
                (deal) => cookieContactVal === deal.contactId);
        else
            window.removeFilter('contact-filter');
    }

    if (isTop && window.Cookies.get('department-sales-filter')) {

        var cookieDepSalesVal = window.Cookies.get('department-sales-filter').split(',');

        if (cookieDepSalesVal.length > 0)
            editFilterFunction('department-sales-filter',
                (deal) => cookieDepSalesVal.some(o => o === deal.salesDepartmentDealId));
        else
            window.removeFilter('department-sales-filter');
    }

    if (isTop && window.Cookies.get('department-industrial-filter')) {

        var cookieDepIndVal = window.Cookies.get('department-industrial-filter').split(',');

        if (cookieDepIndVal.length > 0)
            editFilterFunction('department-industrial-filter',
                (deal) => cookieDepIndVal.some(o => o === deal.industrialDepId));
        else
            window.removeFilter('department-industrial-filter');
    }

    if (isTop && window.Cookies.get('sales-office-filter')) {

        var cookieSalesOfficeVal = window.Cookies.get('sales-office-filter').split(',');

        if (cookieSalesOfficeVal.length > 0)
            editFilterFunction('sales-office-filter',
                (deal) => cookieSalesOfficeVal.some(o => o === deal.salesUnitDealId));
        else
            window.removeFilter('sales-office-filter');
    }

    if (window.Cookies.get('responsible-product-filter')) {

        var cookieRespProductVal = window.Cookies.get('responsible-product-filter');

        if (cookieRespProductVal.length > 0)
            editFilterFunction('responsible-product-filter',
                (deal) => deal.responsibleProduct.some(rp => rp === cookieRespProductVal));
        else
            window.removeFilter('responsible-product-filter');
    }

    if (window.Cookies.get('responsible-mp-filter')) {

        var cookieRespMpVal = window.Cookies.get('responsible-mp-filter');

        if (cookieRespMpVal.length > 0)
            editFilterFunction('responsible-mp-filter',
                (deal) => deal.responsibleMP.some(rp => rp === cookieRespMpVal));
        else
            window.removeFilter('responsible-mp-filter');
    }

    if (window.Cookies.get('step-filter')) {

        var cookieStepVal = window.Cookies.get('step-filter').split(',');

        if (cookieStepVal.length > 0)
            editFilterFunction('step-filter',
                (deal) => cookieStepVal.some(o => o === deal.step));
        else
            window.removeFilter('step-filter');
    }

    if ((isTop || isDepHeader) && window.Cookies.get('sale-filter')) {

        var cookieSaleVal = window.Cookies.get('sale-filter').split(',');

        if (cookieSaleVal.length > 0)
            editFilterFunction('sale-filter',
                (deal) => cookieSaleVal.some(o => o === deal.responsibleUserId));
        else
            window.removeFilter('sale-filter');
    }

};

function ClearFilterCookies() {
    window.Cookies.remove('contract-date-filter-to');
    window.Cookies.remove('contract-date-filter-from');
    window.removeFilter('contract-date-filter');
    window.Cookies.remove('contract-date-filter-from');
    window.removeFilter('contract-date-filter-from');
    window.Cookies.remove('organization-filter');
    window.removeFilter('organization-filter');
    window.Cookies.remove('contact-filter');
    window.removeFilter('contact-filter');
    window.Cookies.remove('department-industrial-filter');
    window.removeFilter('department-industrial-filter');
    window.Cookies.remove('department-sales-filter');
    window.removeFilter('department-sales-filter');
    window.Cookies.remove('sales-office-filter');
    window.removeFilter('sales-office-filter');
    window.Cookies.remove('responsible-mp-filter');
    window.removeFilter('responsible-mp-filter');
    window.Cookies.remove('responsible-product-filter');
    window.removeFilter('responsible-product-filter');
    window.Cookies.remove('step-filter');
    window.removeFilter('step-filter');
    window.Cookies.remove('sale-filter');
    window.removeFilter('sale-filter');
    window.Cookies.remove('expected-margin-from');
    window.removeFilter('expected-margin-from');
    window.Cookies.remove('expected-margin-to');
    window.removeFilter('expected-margin-to');
    window.Cookies.remove('expert-margin-from');
    window.removeFilter('expert-margin-from');
    window.Cookies.remove('expert-margin-to');
    window.removeFilter('expert-margin-to');
};