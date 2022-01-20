

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
                (cont) => $('#sales-office-filter').val().some(o => o === cont.salesOfficeId));
        } else
            window.removeFilter('sales-office-filter');

        window.filterContacts();

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
                (cont) => $('#sale-filter').val().some(o => o === cont.responsibleUserId));
        } else
            window.removeFilter('sale-filter');

        window.filterContacts();
    });

    $('#gender-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('gender-filter');
        window.Cookies.set('gender-filter', $('#gender-filter').val(), { expires: 60 });

        if ($('#gender-filter').val().length > 0) {

            var select = document.getElementById('gender-filter');

            $(select.children[clickedIndex]).prependTo('#gender-filter');

            $('#gender-filter').selectpicker('refresh');

            window.editFilterFunction('gender-filter',
                (cont) => $('#gender-filter').val().some(o => o === cont.genderId));
        } else
            window.removeFilter('gender-filter');

        window.filterContacts();

    });

    $('#role-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('role-filter');
        window.Cookies.set('role-filter', $('#role-filter').val(), { expires: 60 });

        if ($('#role-filter').val().length > 0) {

            var select = document.getElementById('role-filter');

            $(select.children[clickedIndex]).prependTo('#role-filter');

            $('#role-filter').selectpicker('refresh');

            window.editFilterFunction('role-filter',
                (cont) => $('#role-filter').val().some(o => o === cont.roleId));
        } else
            window.removeFilter('role-filter');

        window.filterContacts();

    });

    $('#city').on('keyup',
        function () {
            if (this.value !== "")
                $(filterElementsMap.get('city')).addClass('checked-filter');
            else
                $(filterElementsMap.get('city')).removeClass('checked-filter');

            table
                .columns(-1)
                .search(this.value)
                .draw();
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

            window.editFilterFunction('organization-filter',
                (cont) => $('#organization-filter').val().some(o => o === cont.organizationId));
        } else
            window.removeFilter('organization-filter');

        window.filterContacts();

    });

    $(".bs-select-all").on('click', function (e) {
        var selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterContacts();
    });

    $(".bs-deselect-all").on('click', function (e) {
        var selectId = $(e.target).parent().parent().parent().parent().find('.selectpicker')[0].id;

        window.removeFilter(selectId);
        window.Cookies.remove(selectId);

        window.filterContacts();
    });
}