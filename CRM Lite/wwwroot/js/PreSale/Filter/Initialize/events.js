function initializePreSalesEvents() {

    $('#region-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('region-filter');
        window.Cookies.set('region-filter', $('#region-filter').val(), { expires: 60 });

        if ($('#region-filter').val().length > 0) {
            var select = document.getElementById('region-filter');

            $(select.children[clickedIndex]).prependTo('#region-filter');

            $('#region-filter').selectpicker('refresh');

            window.editFilterFunction('region-filter',
                (cont) => $('#region-filter').val().some(o => o === cont.regionId));
        }
        else
            window.removeFilter('region-filter');

        window.filterItems();
    });

    $('#pre-sale-status-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('pre-sale-status-filter');
        window.Cookies.set('pre-sale-status-filter', $('#pre-sale-status-filter').val(), { expires: 60 });

        if ($('#pre-sale-status-filter').val().length > 0) {
            var select = document.getElementById('pre-sale-status-filter');

            $(select.children[clickedIndex]).prependTo('#pre-sale-status-filter');

            $('#pre-sale-status-filter').selectpicker('refresh');

            window.editFilterFunction('pre-sale-status-filter',
                (cont) => $('#pre-sale-status-filter').val().some(o => o === cont.statusId));
        }
        else
            window.removeFilter('pre-sale-status-filter');

        window.filterItems();
    });

    $('#responsible-user-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('responsible-user-filter');
        window.Cookies.set('responsible-user-filter', $('#responsible-user-filter').val(), { expires: 60 });

        if ($('#responsible-user-filter').val().length > 0) {

            var select = document.getElementById('responsible-user-filter');

            $(select.children[clickedIndex]).prependTo('#responsible-user-filter');

            $('#responsible-user-filter').selectpicker('refresh');

            window.editFilterFunction('responsible-user-filter',
                (cont) => $('#responsible-user-filter').val().some(o => o === cont.responsibleUserId));
        }
        else
            window.removeFilter('responsible-user-filter');

        window.filterItems();
    });

    initializebuttonEvents();
}

function initializePreSaleGroupsEvents() {

    $('#pre-sale-group-status').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('pre-sale-group-status');
        window.Cookies.set('pre-sale-group-status', $('#pre-sale-group-status').val(), { expires: 60 });

        if ($('#pre-sale-group-status').val().length > 0) {
            var select = document.getElementById('pre-sale-group-status');

            $(select.children[clickedIndex]).prependTo('#pre-sale-group-status');

            $('#pre-sale-group-status').selectpicker('refresh');

            window.editFilterFunction('pre-sale-group-status',
                (cont) => $('#pre-sale-group-status').val().some(o => o === cont.statusId));
        } else
            window.removeFilter('pre-sale-group-status');

        window.filterItems();
    });

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
                (cont) => $('#sales-office-filter').val().some(o => o === cont.departmentId));
        } else
            window.removeFilter('sales-office-filter');

        window.filterItems();

    });

    initializebuttonEvents();
}

function initializebuttonEvents() {
    $(".bs-select-all").on('click', function (e) {
        var selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterItems();
    });

    $(".bs-deselect-all").on('click', function (e) {
        var selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterItems();
    });
}