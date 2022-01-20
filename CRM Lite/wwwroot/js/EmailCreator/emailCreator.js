var saveFunctionsIsOpen = true;
var id;

$(function () {
    document.querySelector('body').classList.add('sidebar-hidden');
    $('#email-constructor').mjml({
        needToShowSaved: saveFunctionsIsOpen
    });

    if (saveFunctionsIsOpen)
        InitTemplateTableAndLoadSavedTemplates();

    id = location.href.split('/')[location.href.split('/').length - 1];

    if (id !== "EmailTemplate") {
        window.LoadTemplate(id);
        $('.fixedsavebut').on('click',
            () => {
                modalUpdateTemplate.open();
            });
    } else
        $('.fixedsavebut').on('click',
            () => {
                modalNewTemplate.open();
            });

    InitModalToCreateNewTemplate();
    InitModalToUpdateTemplate();

    $(".additional-receivers").select2({
        tags: true,
        placeholder: "Добавить получателей",
        width: "100%"
    }).on('select2:selecting', function (e) {
        if (!window.validateEmail(e.params.args.data.text))
            e.preventDefault();
    });

    $(".marketing-lists").select2({
        placeholder: "Добавить маркетинговые списки",
        width: "100%",
        ajax: {
            url: `${api}/api/MarketingList/ForList`,
            processResults: function (data) {
                let results = data.map((el) => {
                    return {
                        text: el.name,
                        id: el.id
                    };
                });
                return {
                    results: results
                };
            }
        }
    });
});

function InitModalToCreateNewTemplate() {
    let newListModal = new RModal(document.getElementById('modal-save-template'), {

        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        newListModal.keydown(ev);
    }, false);

    window.modalNewTemplate = newListModal;
}

function InitModalToUpdateTemplate() {
    let modalUpdateTemplate = new RModal(document.getElementById('modal-update-template'), {

        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        modalUpdateTemplate.keydown(ev);
    }, false);

    window.modalUpdateTemplate = modalUpdateTemplate;
}

function InitTemplateTableAndLoadSavedTemplates() {
    var templateTable = $('#templates-table').DataTable({
        dom: "<'row justify-content-left pl-2'f>" +
            "<'row'<'col-12'tr>>" +
            "<'row'<'col-12'>>",
        pageLength: 7,
        drawCallback: function (settings) {
            if (settings.json) {
                templateTable.rows(function (idx, data, node) {
                    return id === data.id;
                }).select();
            }
        },
        ajax: {
            "type": "GET",
            "url": `${api}/api/EmailTemplates`,
            "xhrFields": {
                withCredentials: true
            },
            "dataSrc": function (json) {
                json = json.map((el) => {
                    el.isSelected = el.id === id;
                    return el;
                });
                return json;
            }
        },
        buttons: [
            {
                extend: 'colvis',
                text: 'Показать/скрыть столбцы',
                className: "d-none"
            }
        ],
        "language": {
            url: "/lib/DataTables/datatables.language.russian.json"
        },
        "columns": [
            {
                "data": "isSelected",
                "visible": false
            },
            { "data": "id", "visible": false },
            { "data": "name" },
            { "data": "authorName" },
            { "data": "createdDateStr" }
        ],
        order: [[0, "desc"]]
    });

    $('#templates-table').on('click',
        'tbody tr',
        function () {
            window.open(`/Campaigns/EmailTemplate/${(templateTable.row(this).data().id)}`, '_blank');
        });
    $('#templates-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });

}