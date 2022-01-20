function loadAndFilterContactTable(id) {
    if (id) {
        $.ajax({
            type: "GET",
            url: `${api}/api/MarketingList/${id}`,
            success: function (data) {
                if (data.isLocked) {
                    $('#marketingList-contact-table-with-filters').siblings('.alert-danger').fadeIn('slow');
                    return;
                }

                $('#marketingList-contact-table-with-filters').removeClass('d-none');
                [...data.contactsForMarketingList].forEach(value => window.contactObjects.add(value));
                window.contactListTable.clear().rows.add(data.contactsForMarketingList).draw();
                window.contactListTable.rows().select();

                let marketingListName = $('#marketing-list-name');
                marketingListName.val(data.name);

                if (!window.isTopOrMarketing) {
                    marketingListName.attr('disabled', true);
                } else {
                    let saveNameBtn = $('#marketing-list-name-save-btn');

                    marketingListName.on("input",
                        () => {
                            saveNameBtn.fadeIn("slow", function () {
                            });

                            saveNameBtn.closest("form").submit(function (event) {
                                event.preventDefault();
                                window.saveMarketingListName(saveNameBtn);
                            });

                            saveNameBtn.on("click",
                                () => {
                                    window.saveMarketingListName(saveNameBtn);
                                });
                        });
                }
            },
            error: function (xhr) {
                console.log("Ошибка при формировании перечня маркетинговых списков!");
                console.log(xhr);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    }
}

function loadContacts() {
    if (window.tableChangingLocked) 
        return;

    let contactSearchDto = {};
    contactSearchDto.genderId = $('#gender').val();
    contactSearchDto.roleId = $('#role').val();
    contactSearchDto.town = $('#town').val();
    contactSearchDto.name = $('#contact-name').val();
    contactSearchDto.industryId = $('#industry').val();
    contactSearchDto.organizationIds = $('#organization').val().map(o => `organizationIds=${o}`).join("&");

    if (contactSearchDto.genderId === null &&
        contactSearchDto.roleId === null &&
        contactSearchDto.industryId === null &&
        contactSearchDto.organizationIds === "" &&
        contactSearchDto.name === "" &&
        contactSearchDto.town === "")
    {
        window.contactListTable.clear().draw();
        $('.dataTables_empty').text("В таблице отсутствуют данные");
        return;
    }

    $('.dataTables_empty').text("Идёт загрузка контактов...");

    if (contactSearchDto.organizationIds === "")
        contactSearchDto.organizationIds = "organizationIds=";

    $.ajax({
        type: "GET",
        url: `${api}/api/Contacts/ForMarketingList?industryId=${contactSearchDto.industryId}&town=${contactSearchDto.town}&name=${contactSearchDto.name}&roleId=${contactSearchDto.roleId}&genderId=${contactSearchDto.genderId}&${contactSearchDto.organizationIds}`,
        success: function (data) {
            window.contactListTable.clear().draw();
            window.contactListTable.rows.add(data).draw();
            window.contactListTable.rows(function (idx, data, node) {
                return Array.from(window.contactObjects).some((el) => el.id === data.id);
            }).select();

            window.contactListTable.column('0')
                .order('desc')
                .draw();
        },
        error: function (xhr) {
            console.log("Ошибка при получении контактов!");
            console.log(xhr);
        },
        complete: function () {
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}