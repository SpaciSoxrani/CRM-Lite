function initializeLeadsFilterFunctions() {
    if (window.Cookies.get('responsible-user-filter') !== undefined && window.Cookies.get('responsible-user-filter') !== "") {

        var cookieResponsibleUserVal = window.Cookies.get('responsible-user-filter').split(',');

        if (cookieResponsibleUserVal.length > 0)
            editFilterFunction('responsible-user-filter',
                (cont) => cookieResponsibleUserVal.some(o => o === cont.responsibleUserId));
        else
            window.removeFilter('responsible-user-filter');
    }

    if (window.Cookies.get('target-filter') !== undefined && window.Cookies.get('target-filter') !== "") {

        var cookieTargetVal = window.Cookies.get('target-filter').split(',');

        if (cookieTargetVal.length > 0)
            editFilterFunction('target-filter',
                (cont) => cookieTargetVal.some(o => o === cont.targetId));
        else
            window.removeFilter('target-filter');
    }

    if (window.Cookies.get('status-filter') !== undefined && window.Cookies.get('status-filter') !== "") {

        var cookieStatusVal = window.Cookies.get('status-filter').split(',');

        if (cookieStatusVal.length > 0)
            editFilterFunction('status-filter',
                (cont) => cookieStatusVal.some(o => o === cont.statusId));
        else
            window.removeFilter('status-filter');
    }

    if (window.Cookies.get('project-filter') !== undefined && window.Cookies.get('project-filter') !== "") {

        var cookieProjectVal = window.Cookies.get('project-filter').split(',');

        if (cookieProjectVal.length > 0)
            editFilterFunction('project-filter',
                (cont) => cookieProjectVal.some(o => o === cont.projectId));
        else
            window.removeFilter('project-filter');
    }
}

function editFilterFunction(functionName, filterFunction) {
    filterFunctions.set(functionName, filterFunction);
    $(filterElementsMap.get(functionName)).addClass('checked-filter');
}