var contactObjects = new Set();
var id;
var contactTable;

$(document).ready(function () {

    InitDataTable();

    id = location.href.split('/')[location.href.split('/').length - 1];
    if (id === "MailingList") id = "";
    else {
        $.ajax({
            type: "GET",
            url: `${api}/api/MarketingList/${id}`,
            success: function (data) {
                [...data.contactsForMarketingList].forEach(value => contactObjects.add(value));
                contactTable.clear().rows.add(data.contactsForMarketingList).draw();
                contactTable.rows().select();
                contactTable.rows(function (idx, data, node) {
                    contactObjects.add(data);
                });

                var mailingListName = $('#mailing-list-name');
                mailingListName.val(data.name);
            },
            error: function (xhr) {
                console.log("Ошибка при формировании перечня маркетинговых списков!");
                console.log(xhr);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    };

    FillFields();
});



var InitDataTable = () => {

    contactTable = $('#contacts-table').DataTable({
        dom: 'Bfrtip',
        fixedColumns: true,
        pageLength: 10,
        buttons: [
            {
                text: 'Выбрать всех',
                action: function () {
                    contactTable.rows().select();
                    contactTable.rows(function (idx, data, node) {
                        contactObjects.add(data);
                    });
                    console.log(contactObjects);
                }
            }
        ],
        "language": {
            url: "/lib/datatables/datatables.language.russian.json"
        },
        "select": {
            "style": "multi",
            "selector": "td"
        },
        "columns": [
            { "data": '' },
            { "data": "id" },
            { "data": "displayName" },
            { "data": "email" },
            { "data": "organizationShortName" },
            { "data": "jobTitle" },
            { "data": "responsibleUserDisplayName" }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "data": null,
                "defaultContent": '',
                "orderable": false,
                "className": 'select-checkbox'
            },
            {
                "targets": [1],
                "visible": false,
                "searchable": true,
            }
        ]
    });

    $('#contacts-table tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            contactObjects.delete(contactTable.row($(this)).data());
        } else {
            $(this).addClass('selected');
            contactObjects.add(contactTable.row($(this)).data());
            console.log(contactObjects);
        }
    });

    $('#create-contact-list').on("click", function() {
        CreateContactList(contactTable);
    });

    $('#send-marketing-list').on("click", function () {
        SendMarketingListToDb(contactObjects);
    });

    $('#cancel-marketing-list').on("click", function () {
        contactTable.rows().deselect();
        contactObjects.clear();
    });

    $('#show-marketing-lists').click(function () {

        var marketingListsTable = $('#marketing-lists-table').DataTable({
            dom: 'Bfrtip',
            destroy: true,
            fixedColumns: true,
            pageLength: 7,
            buttons: [
                {
                    extend: 'colvis',
                    text: 'Показать/скрыть столбцы',
                    className: "d-none"
                }
            ],
            "language": {
                url: "/lib/datatables/datatables.language.russian.json"
            },
            "columns": [
                { "data": "id", "visible": false },
                { "data": "name" }
            ]
        });

        $.ajax({
            type: "GET",
            url: `${api}/api/MarketingList/ForList`,
            success: function (data) {
                marketingListsTable.clear().rows.add(data).draw();
            },
            error: function (xhr) {
                console.log("Ошибка при формировании перечня маркетинговых списков!");
                console.log(xhr);
            },
            xhrFields: {
                withCredentials: true
            }
        });

        $('#marketing-lists-table').on('click',
            'tbody tr',
            function () {
                window.open(`/Campaigns/MailingList/${(marketingListsTable.row(this).data().id)}`, '_blank');
            });
        $('#marketing-lists-table tbody').hover(function () {
            $(this).css('cursor', 'pointer');
        });

        marketingListsTable.buttons().nodes().addClass('hidden');
    });

    $('#show-contact-list').click(function () {

        var contactListTable = $('#contact-list-table').DataTable({
            dom: 'Bfrtip',
            destroy: true,
            data: Array.from(contactObjects),
            fixedColumns: true,
            pageLength: 7,
            buttons: [
                { extend: 'colvis', text: 'Показать/скрыть столбцы' }
            ],
            "language": {
                url: "/lib/datatables/datatables.language.russian.json"
            },
            "columns": [
                { "data": "id" },
                { "data": "displayName" },
                { "data": "organization" },
                { "data": "responsibleUser" },
                { "data": null }
            ],
            "columnDefs": [
                {
                    "targets": [0],
                    "visible": false,
                    "searchable": true,
                },
                {
                    "targets": -1,
                    "visible": true,
                    "data": null,
                    "defaultContent": "<button>Delete</button>"
                }
            ]
        });

        $('#contact-list-table').on("click", "button", function () {
            var deleteObject = contactListTable.row($(this).parents('tr')).data();
            contactObjects.delete(deleteObject);
            contactTable.rows(function(idx, data, node) {

                if (data.id === deleteObject.id)
                    node.classList.remove('selected');

            });
            contactListTable.row($(this).parents('tr')).remove().draw(false);
        });
    });
};

var FillFields = () => {

    $.ajax({
        url: `${api}/api/Industries`,
        success: function (data) {
            var ind = $('#industry')
            $.each(data, function (idx, a) {
                ind.append(new Option(a.name, a.id));
            });
            $("#industry").val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/ContactRoles`,
        success: function (data) {
            var role = $('#role')
            $.each(data, function (idx, a) {
                role.append(new Option(a.name, a.id));
            });
            role.val(null);
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
        },
        xhrFields: {
            withCredentials: true
        }
    });
};

var CreateContactList = (contactTable) => {

    var contactSearchDto = {};
    contactSearchDto.genderId = $('#gender').val();
    contactSearchDto.roleId = $('#role').val();
    contactSearchDto.town = $('#town').val();
    contactSearchDto.industryId = $('#industry').val();
    contactSearchDto.organizationIds = $('#organization').val().map(o => `organizationIds=${o}`).join("&");

    if (contactSearchDto.organizationIds === "")
        contactSearchDto.organizationIds = "organizationIds=";

    $.LoadingOverlay("show");

    $.ajax({
        type: "GET",
        url: `${api}/api/Contacts/ForMarketingList?industryId=${contactSearchDto.industryId}&town=${contactSearchDto.town}&roleId=${contactSearchDto.roleId}&genderId=${contactSearchDto.genderId}&${contactSearchDto.organizationIds}`,
        data: JSON.stringify(contactSearchDto),
        contentType: "application/json",
        success: function (data) {
            contactTable.clear().rows.add(data).draw();
            contactTable.rows(function (idx, data, node) {
                for (let item of contactObjects) {
                    if (item.id === data.id)
                        node.classList.add('selected');
                }
            });
        },
        error: function (xhr) {
            console.log("Ошибка при получении контактов!");
            console.log(xhr);
        },
        complete: function () {
            $.LoadingOverlay("hide");
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}

var SendMarketingListToDb = (contactObjects) => {

    var marketingListName = $('#mailing-list-name').val();

    var contactsIds = [...contactObjects].map(contact => contact.id);

    if (marketingListName === "" || contactsIds.length === 0) {
        $("#validation-error").fadeTo(4000, 500).slideUp(500);
        $("html, body").animate({
            scrollTop: 0
        }, 450);
        return false;
    }

    var marketingListDto = {};

    marketingListDto.contactIds = contactsIds;
    marketingListDto.name = marketingListName;
    if (id !== "") {
        marketingListDto.id = id;
        $.ajax({
            type: "PUT",
            url: `${api}/api/MarketingList`,
            url: `${api}/api/MarketingList/${id}`,
            data: JSON.stringify(marketingListDto),
            contentType: "application/json",
            success: function (data) {
                console.log(data);
                console.log("MarketingList Saved");
                window.location.href = `/Campaigns/MailingList/${data.id}`;
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON',
            xhrFields: {
                withCredentials: true
            }
        });
    } else
        $.ajax({
            type: "POST",
            url: `${api}/api/MarketingList`,
            data: JSON.stringify(marketingListDto),
            contentType: "application/json",
            success: function (data) {
                console.log(data);
                console.log("MarketingList Saved");
                window.location.href = `/Campaigns/MailingList/${data.id}`;
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON',
            xhrFields: {
                withCredentials: true
            }
        });
}