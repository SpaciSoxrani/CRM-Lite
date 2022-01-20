function initializeLeadsFilters(data) {
    $('#upload-date').datepicker({
        onSelect(formattedDate, date, inst) {

            if (formattedDate.length > 0) {
                if (date.length === 1) {
                    window.editFilterFunction('upload-date-filter',
                        (lead) => Date.parse(lead.receiptDate) >= date[0]);

                    window.Cookies.remove('upload-date-filter-to');
                    window.Cookies.remove('upload-date-filter-from');
                    window.Cookies.set('upload-date-filter-from', date[0], { expires: 60 });
                } else if (date.length === 2) {
                    window.editFilterFunction('upload-date-filter',
                        (lead) => Date.parse(lead.receiptDate) >= date[0] &&
                            Date.parse(lead.receiptDate) <= date[1]);

                    window.Cookies.remove('upload-date-filter-from');
                    window.Cookies.set('upload-date-filter-from', date[0], { expires: 60 });

                    window.Cookies.remove('upload-date-filter-to');
                    window.Cookies.set('upload-date-filter-to', date[1], { expires: 60 });
                }
            } else {
                window.Cookies.remove('upload-date-filter-to');
                window.Cookies.remove('upload-date-filter-from');
                window.removeFilter('upload-date-filter');
            }

            window.filterItems();
        }
    });

    $('.datepicker-here').each(function () {
        $(this).keypress(function () {
            return false;
        });
        $(this).attr("autocomplete", "off");
    });

    if (window.Cookies.get('upload-date-filter-from') !== undefined &&
        window.Cookies.get('upload-date-filter-from') !== "") {

        var cookieFromVal = window.Cookies.get('upload-date-filter-from');
        var cookieDate = [];

        cookieDate[0] = new Date(cookieFromVal);

        if (window.Cookies.get('upload-date-filter-to') !== undefined &&
            window.Cookies.get('upload-date-filter-to') !== "") {

            var cookieToVal = window.Cookies.get('upload-date-filter-to');

            cookieDate[1] = new Date(cookieToVal);
        }

        var myDatepicker = $('#upload-date').datepicker().data('datepicker');

        myDatepicker.selectDate(cookieDate);
    }

    $.ajax({
        url: `${api}/api/Leads/LeadTargets`,
        success: function (data) {
            $("#target-filter").empty();

            $.each(data, function (idx, a) {
                $("#target-filter").append(new Option(a.name, a.id));
            });

            if ($("#target-filter").val().length === 0)
                $("#target-filter").val(null);

            $('#target-filter').selectpicker('refresh');

            getCookiesMultipleSelect('target-filter');

            $('#target-filter option:selected').prependTo('#target-filter');

            $('#target-filter').selectpicker('refresh');
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Leads/LeadStatuses`,
        success: function (data) {
            $("#status-filter").empty();

            $.each(data, function (idx, a) {
                $("#status-filter").append(new Option(a.name, a.id));
            });

            if ($("#status-filter").val().length === 0)
                $("#status-filter").val(null);

            $('#status-filter').selectpicker('refresh');

            getCookiesMultipleSelect('status-filter');

            $('#status-filter option:selected').prependTo('#status-filter');

            $('#status-filter').selectpicker('refresh');
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Leads/LeadProjects`,
        success: function (data) {
            $("#project-filter").empty();

            $.each(data, function (idx, a) {
                $("#project-filter").append(new Option(a.name, a.id));
            });

            if ($("#project-filter").val().length === 0)
                $("#project-filter").val(null);

            $('#project-filter').selectpicker('refresh');

            getCookiesMultipleSelect('project-filter');

            $('#project-filter option:selected').prependTo('#project-filter');

            $('#project-filter').selectpicker('refresh');
        },
        xhrFields: {
            withCredentials: true
        }
    });

    initializeLeadsResponsibleUserFilter(data)
}

function initializeLeadsResponsibleUserFilter(data) {
    $("#responsible-user-filter").empty();

    var responsibleUsers = [];
    $.each(data, function (idx, a) {
        if (a.responsibleUser && !responsibleUsers.find(item => item == a.responsibleUserId)) {
            $("#responsible-user-filter").append(new Option(a.responsibleUser, a.responsibleUserId));
            responsibleUsers.push(a.responsibleUserId);
        }
    });

    if ($("#responsible-user-filter").val().length === 0)
        $("#responsible-user-filter").val(null);

    $('#responsible-user-filter').selectpicker('refresh');

    getCookiesMultipleSelect('responsible-user-filter');

    $('#responsible-user-filter option:selected').prependTo('#responsible-user-filter');

    $('#responsible-user-filter').selectpicker('refresh');
}

function getCookiesMultipleSelect(selectName) {

    if (window.Cookies.get(selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get(selectName).split(',');
    var filterVal = $('#' + selectName).val();
    var eq = cookieVal.length === filterVal.length && cookieVal.every((e, i) => e === filterVal[i]);

    if (cookieVal !== [] && cookieVal[0] !== "" && !eq) {
        $(filterElementsMap.get(selectName)).addClass('checked-filter');
        $('#' + selectName).selectpicker('val', cookieVal);
    }
}