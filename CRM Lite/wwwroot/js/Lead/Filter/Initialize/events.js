function initializeLeadsEvents() {
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

    $('#target-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('target-filter');
        window.Cookies.set('target-filter', $('#target-filter').val(), { expires: 60 });

        if ($('#target-filter').val().length > 0) {

            var select = document.getElementById('target-filter');

            $(select.children[clickedIndex]).prependTo('#target-filter');

            $('#target-filter').selectpicker('refresh');

            window.editFilterFunction('target-filter',
                (cont) => $('#target-filter').val().some(o => o === cont.targetId));
        }
        else
            window.removeFilter('target-filter');

        window.filterItems();
    });

    $('#status-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('status-filter');
        window.Cookies.set('status-filter', $('#status-filter').val(), { expires: 60 });

        if ($('#status-filter').val().length > 0) {

            var select = document.getElementById('status-filter');

            $(select.children[clickedIndex]).prependTo('#status-filter');

            $('#status-filter').selectpicker('refresh');

            window.editFilterFunction('status-filter',
                (cont) => $('#status-filter').val().some(o => o === cont.statusId));
        }
        else
            window.removeFilter('status-filter');

        window.filterItems();
    });

    $('#project-filter').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {

        if (isSelected === null && clickedIndex === null)
            return;

        window.Cookies.remove('project-filter');
        window.Cookies.set('project-filter', $('#project-filter').val(), { expires: 60 });

        if ($('#project-filter').val().length > 0) {

            var select = document.getElementById('project-filter');

            $(select.children[clickedIndex]).prependTo('#project-filter');

            $('#project-filter').selectpicker('refresh');

            window.editFilterFunction('project-filter',
                (cont) => $('#project-filter').val().some(o => o === cont.projectId));
        }
        else
            window.removeFilter('project-filter');

        window.filterItems();
    });

    initializeButtonEvents();
}

function initializeButtonEvents() {
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