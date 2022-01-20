var departmentSalesFilterVal;
var departmentIndustrialFilterVal;
var organizationFilterVal;
var contactFilterVal;

var InitializeEventTriggers = () => {

    $('#organization-filter').on('show.bs.select', function (e) {
        $.ajax({
            url: `${location.origin}/Organizations/GetActiveOrganizations`,
            success: function (data) {
                $.each(data, function (idx, a) {

                    var select = document.getElementById('organization-filter');

                    if (!window.organizationFilterValues.has(a.id)) {
                        $("#organization-filter").append(new Option(a.shortName, a.id));

                        select.children[idx].setAttribute("data-tokens", a.fullName);
                    }

                });

                if ($("#organization-filter").val().length === 0)
                    $("#organization-filter").val(null);

                $('#organization-filter').selectpicker('refresh');

            },
            xhrFields: {
                withCredentials: true
            }
        });
    });

    $('#contact-filter').on('show.bs.select', function (e) {
        $.ajax({
            url: `${location.origin}/Contacts/Short`,
            success: function (data) {
                $.each(data, function (idx, a) {
                    if (!window.contactFilterValues.has(a.id))
                        $("#contact-filter").append(new Option(a.displayName, a.id));

                });

                if ($("#contact-filter").val().length === 0)
                    $("#contact-filter").val(null);

                $('#contact-filter').selectpicker('refresh');

            },
            xhrFields: {
                withCredentials: true
            }
        });
    });

    $('#organization-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('organization-filter');
        window.Cookies.set('organization-filter', $('#organization-filter').val(), { expires: 60 });

        if ($('#organization-filter').val().length > 0) {

            var select = document.getElementById('organization-filter');

            $(select.children[clickedIndex]).prependTo('#organization-filter');

            $('#organization-filter').selectpicker('refresh');

            organizationFilterVal = new Set($('#organization-filter').val());

            window.editFilterFunction('organization-filter',
                (deal) => organizationFilterVal.has(deal.organizationId));
        } else
            window.removeFilter('organization-filter');

        window.filterDeals();

    });

    $('#contact-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('contact-filter');
        window.Cookies.set('contact-filter', $('#contact-filter').val(), { expires: 60 });

        if ($('#contact-filter').val().length > 0) {
            contactFilterVal = new Set($('#contact-filter').val());

            $('#contact-filter option:selected').prependTo('#contact-filter');
            $('#contact-filter').selectpicker('refresh');

            window.editFilterFunction('contact-filter',
                (deal) => contactFilterVal.has(deal.contactId));
        } else
            window.removeFilter('contact-filter');

        window.filterDeals();

    });

    if (isTop)
        $('#department-sales-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

            if (isSelected === null && clickedIndex === null)
                return;

            window.Cookies.remove('department-sales-filter');
            window.Cookies.set('department-sales-filter', $('#department-sales-filter').val(), { expires: 60 });

            departmentSalesFilterVal = $('#department-sales-filter').val();

            var departmentCount = 0;

            if ($('#department-sales-filter').val().length > 0) {
                departmentCount = $('#department-sales-filter').val().length;

                if ($('#department-industrial-filter').val().length > 0) {
                    departmentCount = $('#department-sales-filter').val().length +
                        $('#department-industrial-filter').val().length;
                }

                window.editFilterFunction('department-sales-filter',
                    (deal) => departmentSalesFilterVal.some(o => o === deal.salesDepartmentDealId));
            } else {
                if ($('#department-industrial-filter').val().length > 0) {
                    departmentCount = $('#department-industrial-filter').val().length;
                }

                window.removeFilter('department-sales-filter');
            }

            if (departmentCount !== 0)
                $('#department-button').text("Выбрано " + departmentCount + " департаментов");
            else
                $('#department-button').text("Департамент");

            window.filterDeals();

        });

    if (isTop)
        $('#department-industrial-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

            if (isSelected === null && clickedIndex === null)
                return;

            window.Cookies.remove('department-industrial-filter');
            window.Cookies.set('department-industrial-filter', $('#department-industrial-filter').val(), { expires: 60 });

            departmentIndustrialFilterVal = $('#department-industrial-filter').val();

            var departmentCount = 0;

            if ($('#department-industrial-filter').val().length > 0) {
                departmentCount = $('#department-industrial-filter').val().length;

                if ($('#department-sales-filter').val().length > 0) {
                    departmentCount = $('#department-industrial-filter').val().length +
                        $('#department-sales-filter').val().length;
                }


                window.editFilterFunction('department-industrial-filter',
                    (deal) => departmentIndustrialFilterVal.some(o => o === deal.industrialDepId));
            } else {
                if ($('#department-sales-filter').val().length > 0) {
                    departmentCount = $('#department-sales-filter').val().length;
                }

                window.removeFilter('department-industrial-filter');
            }

            if (departmentCount !== 0)
                $('#department-button').text("Выбрано " + departmentCount + " департаментов");
            else
                $('#department-button').text("Департамент");

            window.filterDeals();

        });

    if (isTop)
        $('#sales-office-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

            if (isSelected === null && clickedIndex === null)
                return;

            window.Cookies.remove('sales-office-filter');
            window.Cookies.set('sales-office-filter', $('#sales-office-filter').val(), { expires: 60 });

            if ($('#sales-office-filter').val().length > 0) {
                var select = document.getElementById('sales-office-filter');

                $(select.children[clickedIndex]).prependTo('#sales-office-filter');

                $('#sales-office-filter').selectpicker('refresh');

                window.editFilterFunction('sales-office-filter',
                    (deal) => $('#sales-office-filter').val().some(o => o === deal.salesUnitDealId));
            } else
                window.removeFilter('sales-office-filter');

            window.filterDeals();

        });

    $('#responsible-product-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('responsible-product-filter');
        window.Cookies.set('responsible-product-filter', $('#responsible-product-filter').val(), { expires: 60 });

        if ($('#responsible-product-filter').val().length > 0) {
            $('#responsible-product-filter option:selected').prependTo('#responsible-product-filter');
            $('#responsible-product-filter').selectpicker('refresh');

            window.editFilterFunction('responsible-product-filter',
                (deal) => deal.responsibleProduct.some(rp => rp === $('#responsible-product-filter').val()[0]));
        } else
            window.removeFilter('responsible-product-filter');

        window.filterDeals();

    });

    $('#responsible-mp-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('responsible-mp-filter');
        window.Cookies.set('responsible-mp-filter', $('#responsible-mp-filter').val(), { expires: 60 });

        if ($('#responsible-mp-filter').val().length > 0) {
            $('#responsible-mp-filter option:selected').prependTo('#responsible-mp-filter');
            $('#responsible-mp-filter').selectpicker('refresh');

            window.editFilterFunction('responsible-mp-filter',
                (deal) => deal.responsibleMP.some(rp => rp === $('#responsible-mp-filter').val()[0]));
        } else
            window.removeFilter('responsible-mp-filter');

        window.filterDeals();

    });

    $('#step-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('step-filter');
        window.Cookies.set('step-filter', $('#step-filter').val(), { expires: 60 });

        if ($('#step-filter').val().length > 0) {

            var select = document.getElementById('step-filter');

            $(select.children[clickedIndex]).prependTo('#step-filter');

            $('#step-filter').selectpicker('refresh');

            window.editFilterFunction('step-filter',
                (deal) => $('#step-filter').val().some(o => o === deal.step));
        } else
            window.removeFilter('step-filter');

        window.filterDeals();

    });

    if (isTop || isDepHeader)
        $('#sale-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

            if (isSelected === null && clickedIndex === null)
                return;

            window.Cookies.remove('sale-filter');
            window.Cookies.set('sale-filter', $('#sale-filter').val(), { expires: 60 });

            if ($('#sale-filter').val().length > 0) {

                var select = document.getElementById('sale-filter');

                $(select.children[clickedIndex]).prependTo('#sale-filter');

                $('#sale-filter').selectpicker('refresh');

                window.editFilterFunction('sale-filter',
                    (deal) => $('#sale-filter').val().some(o => o === deal.responsibleUserId));
            } else
                window.removeFilter('sale-filter');

            window.filterDeals();

        });

    $('#status-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        if ($('#status-filter').val().length > 0) {
            window.editFilterFunction('status-filter',
                (deal) => $('#status-filter').val().some(o => o === deal.dealStatusId));
        } else
            window.removeFilter('status-filter');

        window.filterDeals();

    });

    $(".bs-select-all").on('click', function (e) {
        let selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        let departmentCount;

        if ($('#department-button').attr('aria-expanded') === "true") {
            if (selectId === "department-sales-filter")
                departmentCount = $('#department-industrial-filter').val().length + 4;
            else
                departmentCount = $('#department-sales-filter').val().length + 4;
        }

        if (departmentCount)
            $('#department-button').text("Выбрано " + departmentCount + " департаментов");
        else
            $('#department-button').text("Департамент");

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterDeals();
    });

    $(".bs-deselect-all").on('click', function (e) {
        let selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        let departmentCount;

        if ($('#department-button').attr('aria-expanded') === "true") {
            if (selectId === "department-sales-filter")
                departmentCount = $('#department-industrial-filter').val().length + 0;
            else
                departmentCount = $('#department-sales-filter').val().length + 0;
        }

        if (departmentCount)
            $('#department-button').text("Выбрано " + departmentCount + " департаментов");
        else
            $('#department-button').text("Департамент");

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterDeals();
    });
};