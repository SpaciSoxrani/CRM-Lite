var tableChangingLocked = false;

$(function () {
    fillFilterFields();
});

function clearFilters() {

    tableChangingLocked = true;

    $('#town').val("");
    $('#contact-name').val("");
    $('#industry').val(null).change();
    $('#role').val(null).change();
    $('#organization').val(null).change();
    $('#gender').val(null).change();

    tableChangingLocked = false;

    let contactObjs = Array.from(window.contactObjects);
    window.contactListTable.clear().draw();
    window.contactListTable.rows.add(contactObjs).draw();
    window.contactListTable.rows(function (idx, data, node) {
        return contactObjs.some((el) => el.id === data.id);
    }).select();
}

function fillFilterFields() {
    $('#town').on("blur",
        () => {
            window.loadContacts();
        });

    $('#contact-name').on("blur",
        () => {
            window.loadContacts();
        });

    $.ajax({
        url: `${api}/api/Industries`,
        success: function (data) {
            var ind = $('#industry');
            $.each(data, function (idx, a) {
                ind.append(new Option(a.name, a.id));
            });
            ind.val(null);

            ind.on("change",
                () => {
                    window.loadContacts();
                });
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/MarketingList/Presents`,
        success: function (data) {
            var present = $('#present-type');
            $.each(data, function (idx, a) {
                present.append(new Option(a.name, a.id));
            });
            present.val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/ContactRoles`,
        success: function (data) {
            var role = $('#role');
            $.each(data, function (idx, a) {
                role.append(new Option(a.name, a.id));
            });
            role.val(null);
            role.on("change",
                () => {
                    window.loadContacts();
                });
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Organizations/Active/OrganizationsNames`,
        success: function (data) {
            var organizations = $('#organization');
            $.each(data, function (idx, a) {
                organizations.append(new Option(a.shortName, a.id));
            });
            organizations.val(null);

            organizations.on("change",
                () => {
                    window.loadContacts();
                });
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Genders`,
        success: function (data) {
            var gender = $('#gender');
            $.each(data, function (idx, a) {
                gender.append(new Option(a.name, a.id));
            });
            gender.val(null);

            gender.on("change",
                () => {
                    window.loadContacts();
                });
        },
        xhrFields: {
            withCredentials: true
        }
    });
};