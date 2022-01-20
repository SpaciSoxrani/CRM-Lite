

var InitializeEventTriggers = () => {


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
                (org) => $('#sales-office-filter').val().some(o => o === org.salesOfficeId));
        } else
            window.removeFilter('sales-office-filter');

        window.filterOrganizations();

    });

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
                (org) => $('#sale-filter').val().some(o => o === org.responsibleUserId));
        } else
            window.removeFilter('sale-filter');

        window.filterOrganizations();
    });

    $('#status-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        if ($('#status-filter').val().length > 0) {
            window.editFilterFunction('status-filter',
                (org) => $('#status-filter').val().some(o => o === org.isActive.toString()));
        } else
            window.removeFilter('status-filter');

        window.filterOrganizations();

    });

    $('#industry-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('industry-filter');
        window.Cookies.set('industry-filter', $('#industry-filter').val(), { expires: 60 });

        if ($('#industry-filter').val().length > 0) {

            var select = document.getElementById('industry-filter');

            $(select.children[clickedIndex]).prependTo('#industry-filter');

            $('#industry-filter').selectpicker('refresh');

            window.editFilterFunction('industry-filter',
                (org) => $('#industry-filter').val().some(o => o === org.industryId));
        } else
            window.removeFilter('industry-filter');

        window.filterOrganizations();

    });

    $('#relationship-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('relationship-filter');
        window.Cookies.set('relationship-filter', $('#relationship-filter').val(), { expires: 60 });

        if ($('#relationship-filter').val().length > 0) {

            var select = document.getElementById('relationship-filter');

            $(select.children[clickedIndex]).prependTo('#relationship-filter');

            $('#relationship-filter').selectpicker('refresh');

            window.editFilterFunction('relationship-filter',
                (org) => $('#relationship-filter').val().some(o => o === org.relationshipId));
        } else
            window.removeFilter('relationship-filter');

        window.filterOrganizations();

    });

    $(".bs-select-all").on('click', function (e) {
        var selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterOrganizations();
    });

    $(".bs-deselect-all").on('click', function (e) {
        var selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterOrganizations();
    });
}