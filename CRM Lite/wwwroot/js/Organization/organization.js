let formIsValid = true;
var id;
var contactTable;
var contactListTable;
var organization;
var dealTable;
var dealListTable;
var bankDetailsId;
var bankDetailsBankId;
var addressId;
var legalAddressId;
var responsibleUserId;
var needToPrevent = true;

$(document).ready(function () {
    id = location.href.split('/')[location.href.split('/').length - 1];
    if (id === "Organization") {
        id = "";
        $('.show-contacts').removeClass('col-md-6').hide();
        $('.show-deals').removeClass('col-md-6').hide();

        $.each($('input, select, textarea'),
            function (el) {
                if (this.id === "")
                    return;

                getCookiesSingle(this.id);
            });

        $.each($('input, select, textarea'),
            function (el) {
                if (this.id === "")
                    return;

                let selector = "#" + this.id;
                $(selector).change(function () {
                    rememberField(this.id);
                });
            });

        $('#is-active').prop('checked', true);
    }

    $('#show-deals').width($('#show-contacts').width());

    InitDataTable();

    extendSortFunction();

    if (id !== "")
        $.ajax({
            type: "GET",
            url: `${api}/api/Organizations/${id}`,
            success: function (data) {
                organization = data;
                bankDetailsId = data.bankDetailsId;
                bankDetailsBankId = data.bankDetailsBankId;
                addressId = data.addressId;
                legalAddressId = data.legalAddressId;
                responsibleUserId = data.responsibleUserId;
                FillFields(data);
                if (id !== "") GetValues(data);
                else $('#is-active').prop('checked', true);
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON'
        });
    else
        FillFields();

});

let stepNumberMap = new Map([
    ['Верификация потребности', 1],
    ['Разработка проекта технического решения', 2],
    ['Согласование решения', 3],
    ['Конкурсная процедура', 4],
    ['Подписание контракта', 5],
    ['Работа по контракту', 6],
    ['Контракт закрыт', 7]
]);

function getNumberFromCurrency(value) {
    if (value === "" || value === 0)
        return 0;

    return Number(value.replace(/[^0-9,.\-]+/g, "").replace(",", ".").replace("₽", "").replace(" ", ""));
}

var InitDataTable = () => {


    contactListTable = $('#contact-list-table').DataTable({
        dom: 'Bfrtip',
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
            {
                "data": "id",
                "className": "id"
            },
            { "data": 'displayName' },
            { "data": 'responsibleName' },
            {
                "data": null,
                "render": function (data, type, row) {
                    return '<button id=' + data.id + ' class="btn btn-danger remove" onclick="deleteContact(\'' + data.id + '\', \'' + data.displayName + '\')">Удалить</button>';
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": true
            }
        ]
    });

    dealListTable = $('#deal-list-table').DataTable({
        dom: '<"top"p>rt<"bottom"><"clear">',
        pageLength: 10,
        ordering: true,
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
            { "data": "id" },
            {
                "data": "name",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return data.replace(/\"/g, '');
                    return data;
                }
            },
            { "data": "dealStatus" },
            { "data": "responsibleName" },
            {
                "data": "stepName",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return stepNumberMap.get(data);
                    return data;
                }
            },
            {
                "data": "estimatedBudget",
                "type": "num",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "estimatedMargin",
                "type": "num",
                "mRender": function (data, type, full) {
                    if (type === 'sort') return getNumberFromCurrency(data);
                    return data;
                }
            },
            {
                "data": "contractSigningDate",
                "sType": "ruDate",
                "mRender": function (data, type, full) {
                    if (type === 'sort' && data === "Не указана") return '31.12.9999';
                    return data;
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false,
                "searchable": true
            }
        ],
        "order": [[2, "asc"]]
    });

    $('#deal-list-table').on('click',
        'tbody tr',
        function () {
            window.open(`/Deals/Deal/${(dealListTable.row(this).data()).id}`, '_blank');
        });

    $('#deal-list-table tbody').hover(function () {
        $(this).css('cursor', 'pointer');
    });

    if (id !== "") {
        $.ajax({
            type: "GET",
            url: `${location.origin}/Contacts/ContactsFromOrganization/${id}`,
            success: function (data) {
                if (data.length === 0) {
                    $('.show-contacts').removeClass('col-md-6').hide();
                    return;
                }

                contactListTable.clear().rows.add(data).draw();
                contactListTable.rows().eq(0).each(function (index) {
                    var data = this.data();
                    contactListTable.cell(index, 1)
                        .data("<a href=\"" +
                            location.origin +
                            "/Contacts/Contact/" +
                            data[index].id +
                            "\">" +
                            data[index].displayName +
                            "</a>");
                });
            },
            error: function (xhr) {
                console.log("Ошибка при формировании перечня контактов!");
                console.log(xhr);
            }
        });

        $.ajax({
            type: "GET",
            url: `${api}/api/Deals/Organization/${id}`,
            success: function (data) {
                if (data.length === 0) {
                    $('.show-deals').removeClass('col-md-6').hide();
                    return;
                }

                data.map((p) => {
                    p.estimatedBudget = thousandSeparator(p.estimatedBudget);
                    p.estimatedMargin = thousandSeparator(p.estimatedMargin);
                });

                dealListTable.clear().rows.add(data).draw();
            },
            error: function (xhr) {
                console.log("Ошибка при формировании перечня сделок!");
                console.log(xhr);
            }
        });
    }
};

function thousandSeparator(str) {
    if ((str === "") || ((str === null)) || ((str === "0.00"))) return "";
    var parts = (str + '').split('.'),
        main = parts[0],
        len = main.length,
        output = '',
        i = len - 1;

    while (i >= 0) {
        output = main.charAt(i) + output;
        if ((len - i) % 3 === 0 && i > 0 && main.charAt(i - 1) !== '-') {
            output = ' ' + output;
        }
        --i;
    }
    if (parts.length > 1) {
        if (parts[1].length === 1) parts[1] += '0';
        output += ',' + parts[1] + " ₽";
    } else {
        output += ",00 ₽";
    }
    return output;
}

var deleteContact = (id, name) => {
    if (confirm('Вы действительно хотите удалить контакт \"' + name + '\"?'))
        $.ajax({
            type: "PUT",
            url: `${location.origin}/Contacts/MakeInvisible/${id}`,
            success: function (data) {
                var table = $('#contact-list-table').DataTable();
                table
                    .row($('#' + id).parents('tr'))
                    .remove()
                    .draw();
            },
            error: function (xhr) {
                if (xhr.status === 403) {
                    swal({
                        title: "У Вас нет доступа к данному объекту!",
                        icon: "error",
                        button: "Ok"
                    });
                } else {
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                }
            }
        });
};

function reloadContacts() {

    $.ajax({
        type: "GET",
        async: false,
        url: `${location.origin}/Contacts/ContactsFromOrganization/${id}`,
        success: function (data) {
            var contact = $('#main-contact');
            $.each(data, function (idx, a) {
                if (!contact.find("option[value='" + a.id + "']").length)
                    contact.append(new Option(a.displayName, a.id, false, false));
            });
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function FillFields(model) {

    $.ajax({
        url: `${api}/api/Departments/ActiveDepartmentsForCreatingOrganization`,
        success: function (data) {
            var sales = $('#sales-office');
            $.each(data, function (idx, a) {
                if (model !== undefined && model.salesOfficeId === a.id)
                    sales.append(new Option(a.name, a.id, true, true));
                else
                    sales.append(new Option(a.name, a.id, false, false));
            });

            if(model === undefined)
                getCookiesSingle("sales-office");
        },
        dataType: 'JSON'
    });

    $.ajax({
        url: `${location.origin}/Contacts/ContactsFromOrganization/${id}`,
        success: function (data) {
            var contact = $('#main-contact');
            $.each(data, function (idx, a) {
                if (model !== undefined && model.mainContactId === a.id)
                    contact.append(new Option(a.displayName, a.id, true, true));
                else
                    contact.append(new Option(a.displayName, a.id, false, false));
            });

            if (model === undefined)
                getCookiesSingle("main-contact");
        }
    });

    $('#main-contact').on('select2:opening', function (e) {
        reloadContacts();
    });

    $.ajax({
        url: `${location.origin}/Organizations/GetOrganizations`,
        success: function (data) {
            var org = $('#parent-organization');
            $.each(data, function (idx, a) {
                if (model !== undefined && model.parentOrganizationId === a.id)
                    org.append(new Option(a.shortName, a.id, true, true));
                else
                    org.append(new Option(a.shortName, a.id, false, false));
            });

            if (model === undefined)
                getCookiesSingle("parent-organization");
        }
    });

    $.ajax({
        url: `${api}/api/industries`,
        success: function (data) {
            var ind = $('#industry');
            $.each(data, function (idx, a) {
                if (model !== undefined && model.industryId === a.id)
                    ind.append(new Option(a.name, a.id, true, true));
                else
                    ind.append(new Option(a.name, a.id, false, false));
            });

            if (model === undefined)
                getCookiesSingle("industry");
        }
    });

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            var responsible = $('#responsible')[0];
            $.each(data, function (idx, a) {
                responsible.append(new Option(a.displayName, a.id));
            });

            if (model !== undefined &&
                model.responsibleUserId !== null && model.responsibleUserId !== undefined) {
                $(responsible).val(model.responsibleUserId);
            } else
                $(responsible).val(user.id);
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    $.ajax({
        url: `${api}/api/relationships`,
        success: function (data) {
            var rel = $('#relationship');
            $.each(data, function (idx, a) {
                if (model !== undefined && model.relationshipId === a.id)
                    rel.append(new Option(a.name, a.id, true, true));
                else
                    rel.append(new Option(a.name, a.id, false, false));
            });

            if (model === undefined)
                getCookiesSingle("relationship");
        }
    });

    $.ajax({
        url: `${api}/api/Interests`,
        success: function (data) {
            var interest = $('#interest');
            $.each(data, function (idx, a) {
                if (model !== undefined && model.interestId === a.id)
                    interest.append(new Option(a.name, a.id, true, true));
                else
                    interest.append(new Option(a.name, a.id, false, false));
            });

            if (model === undefined)
                getCookiesSingle("interest");
        }
    });
}

function CopyAddressValues(el) {
    if ($(el).prop("checked") === true) {
        $("#legal-country").val($("#country").val());
        $("#legal-city").val($("#city").val());
        $("#legal-region").val($("#region").val());
        $("#legal-street").val($("#street").val());
        $("#legal-index").val($("#index").val());
        $("#legal-building").val($("#building").val());
        $("#legal-office").val($("#office").val());
    }
    rememberField("legal-country");
    rememberField("legal-city");
    rememberField("legal-region");
    rememberField("legal-street");
    rememberField("legal-index");
    rememberField("legal-building");
    rememberField("legal-office");
};

function GetValues(model) {
    $("#party").val(model.fullName);
    $("#short-name").val(model.shortName);
    $("#phone").val(model.phone);
    $("#responsible").val(model.responsibleUserId);
    $("#are-addresses-equal").prop('checked', model.isAddressesEqual);
    $("#parent-organization").val(model.parentOrganizationId);
    $("#site").val(model.site);
    $('#email').val(model.email);
    $('#is-active').prop('checked', model.isActive);

    $("#take-on-control").prop("checked", model.isTopManagementControlled);
    if (model.foundationDate !== null) $("#birthday").val(model.foundationDate.substring(0, 10));

    $.ajax({
        type: "GET",
        url: `${api}/api/Addresses/${model.addressId}`,
        success: function (data) {
            $("#country").val(data.country);
            $("#city").val(data.city);
            $("#region").val(data.region);
            $("#street").val(data.street);
            $("#zip-code").val(data.zipCode);
            $("#building").val(data.building);
            $("#office").val(data.office);
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    if (model.legalAddressId !== null)
        $.ajax({
            type: "GET",
            url: `${api}/api/Addresses/${model.legalAddressId}`,
            success: function (data) {
                $("#legal-country").val(data.country);
                $("#legal-city").val(data.city);
                $("#legal-region").val(data.region);
                $("#legal-street").val(data.street);
                $("#legal-index").val(data.zipCode);
                $("#legal-building").val(data.building);
                $("#legal-office").val(data.office);
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON'
        });

    $.ajax({
        type: "GET",
        url: `${api}/api/BankDetails/${model.bankDetailsId}`,
        success: function (data) {
            $("#bank-details-inn").val(data.inn);
            $("#bank-details-kpp").val(data.kpp);
            $("#bank-details-ogrn").val(data.ogrn);
            $("#bank-details-okpo").val(data.okpo);
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    if (model.bankDetailsBankId !== null)
        $.ajax({
            type: "GET",
            url: `${api}/api/BankDetails/${model.bankDetailsBankId}`,
            success: function (data) {
                $("#bank-details-bank-inn").val(data.inn);
                $("#bank-details-bank-kpp").val(data.kpp);

                $("#bank-details-bank-rs").val(data.rs);
                $("#bank-details-bank-ks").val(data.ks);
                $("#bank-details-bank-bik").val(data.bik);
                $("#bank-details-bank-bankname").val(data.bankName);
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON'
        });
}



function saveOrganization() {
    clearRequiredFields();

    checkRequiredFields();

    if (!formIsValid) {
        swal({
            title: "Заполните необходимые поля!",
            icon: "info",
            button: "Ok"
        });
        return;
    }

    var organizationViewModel = {};
    organizationViewModel.id = location.href.split('/')[location.href.split('/').length - 1];

    if (organizationViewModel.id === "Organization")
        organizationViewModel.id = null;

    organizationViewModel.fullName = $("#party").val();
    organizationViewModel.shortName = $("#short-name").val();
    organizationViewModel.phone = $("#phone").val();
    organizationViewModel.parentOrganizationId = $('#parent-organization').val();
    organizationViewModel.foundationDate = $('#foundation-date').val();
    organizationViewModel.email = $('#email').val();
    organizationViewModel.mainContactId = $("#main-contact").val();
    organizationViewModel.site = $("#site").val();
    organizationViewModel.responsibleUserId = $("#responsible").val();
    organizationViewModel.isActive = $('#is-active').prop('checked');

    if (organizationViewModel.responsibleUserId !== responsibleUserId)
        organizationViewModel.responsibleUserChanged = true;

    if (addressId !== null) organizationViewModel.addressId = addressId;
    if (legalAddressId !== null) organizationViewModel.legalAddressId = legalAddressId;

    organizationViewModel.address = {};
    organizationViewModel.legalAddress = {};
    organizationViewModel.bankDetails = {};

    if (addressId !== null) organizationViewModel.address.Id = addressId;
    if (legalAddressId !== null) organizationViewModel.legalAddress.id = legalAddressId;

    organizationViewModel.address.country = $("#country").val();
    organizationViewModel.address.city = $("#city").val();
    organizationViewModel.address.region = $("#region").val();
    organizationViewModel.address.street = $("#street").val();
    organizationViewModel.address.zipCode = $("#zip-code").val();
    organizationViewModel.address.building = $("#building").val();
    organizationViewModel.address.office = $("#office").val();

    organizationViewModel.legalAddress.country = $("#legal-country").val();
    organizationViewModel.legalAddress.city = $("#legal-city").val();
    organizationViewModel.legalAddress.region = $("#legal-region").val();
    organizationViewModel.legalAddress.street = $("#legal-street").val();
    organizationViewModel.legalAddress.zipCode = $("#legal-index").val();
    organizationViewModel.legalAddress.building = $("#legal-building").val();
    organizationViewModel.legalAddress.office = $("#legal-office").val();

    organizationViewModel.industryId = $("#industry").val();
    organizationViewModel.interestId = $("#interest").val();
    organizationViewModel.salesOfficeId = $("#sales-office").val();
    organizationViewModel.relationshipId = $("#relationship").val();

    organizationViewModel.isTopManagementControlled = $("#take-on-control").prop("checked");
    organizationViewModel.isAddressesEqual = $("#are-addresses-equal").prop("checked");

    if (bankDetailsId !== null) organizationViewModel.bankDetailsId = bankDetailsId;
    organizationViewModel.bankDetails = {};
    if (bankDetailsId !== null) organizationViewModel.bankDetails.id = bankDetailsId;

    organizationViewModel.bankDetails.inn = $("#bank-details-inn").val();
    organizationViewModel.bankDetails.kpp = $("#bank-details-kpp").val();
    organizationViewModel.bankDetails.ogrn = $("#bank-details-ogrn").val();
    organizationViewModel.bankDetails.okpo = $("#bank-details-okpo").val();
    organizationViewModel.bankDetails.bankName = "";

    if (bankDetailsBankId !== null) organizationViewModel.bankDetailsBankId = bankDetailsBankId;
    organizationViewModel.bankDetailsBank = {};
    if (bankDetailsBankId !== null) organizationViewModel.bankDetailsBank.id = bankDetailsBankId;
    organizationViewModel.bankDetailsBank.inn = $("#bank-details-bank-inn").val();
    organizationViewModel.bankDetailsBank.kpp = $("#bank-details-bank-kpp").val();
    organizationViewModel.bankDetailsBank.rs = $("#bank-details-bank-rs").val();
    organizationViewModel.bankDetailsBank.ks = $("#bank-details-bank-ks").val();
    organizationViewModel.bankDetailsBank.bik = $("#bank-details-bank-bik").val();
    organizationViewModel.bankDetailsBank.bankName = $("#bank-details-bank-bankname").val();

    if (organizationViewModel.id === null)
        $.ajax({
            type: "GET",
            url: `${api}/api/Organizations/Inn/${organizationViewModel.bankDetails.inn}`,
            success: function (data) {
                console.log(data);
                if (data === null || data === undefined)
                    PostOrganization(organizationViewModel);
                else
                    ShowNotification(organizationViewModel, data);
            },
            error: function (data) {
                swal({
                    title: "Ошибка при сохранении!",
                    icon: "error",
                    button: "Ok"
                });
                console.log(data);
            },
            dataType: 'JSON'
        });
    else
        PutOrganization(organizationViewModel);
}

function cancelEdits() {
    if (id === "")
        $(`.organizationInfo input,
                .organizationInfo select,
					.organizationInfo textarea`).each(function() {

            const element = $(this);

            switch (element.prop("tagName")) {
            case "INPUT":
                if (element.prop("type") === "checkbox") {
                    if (element[0].id === "is-active")
                        element.prop('checked', true);

                    if (element[0].id === "are-addresses-equal" || element[0].id === "take-on-control")
                        element.prop('checked', false);

                } else
                    element.val("");

                break;

            case "SELECT":
                if (element[0].id === "responsible")
                    element.val(user.id).trigger('change');
                else
                    element.val(null).trigger('change');

                break;

            case "TEXTAREA":
                element.val("");

                break;
            }
        });
    else location.reload();
}


function ShowNotification(organizationViewModel, data) {
    swal({
        text: "Организация с данным ИНН уже существует!",
        icon: "info",
        buttons: {
            cancel: "Отмена",
            save: {
                text: "Перезаписать",
                value: "save"
            },
            show: {
                text: "Показать",
                value: "show"
            }
        }
    })
        .then((value) => {
            switch (value) {

                case "show":
                    window.location.href = `/Organizations/Organization/${data.id}`;
                    break;

                case "save":
                    organizationViewModel.id = data.id;
                    organizationViewModel.addressId = data.addressId;
                    organizationViewModel.bankDetailsId = data.bankDetailsId;
                    organizationViewModel.bankDetailsBankId = data.bankDetailsBankId;
                    PutOrganization(organizationViewModel);
                    break;

                default:
                    break;
            }
        });
}

function ShowNotificationForUpdating(id) {
    swal({
        text: "Организация с данным ИНН уже существует!",
        icon: "info",
        buttons: {
            cancel: "Отмена",
            show: {
                text: "Показать",
                value: "show"
            }
        }
    })
        .then((value) => {
            switch (value) {

                case "show":
                    window.location.href = `/Organizations/Organization/${id}`;
                    break;

                default:
                    break;
            }
        });
}

function PostOrganization(organizationViewModel) {
    $.LoadingOverlay("show");

    $.ajax({
        type: "POST",
        url: `${api}/api/Organizations`,
        data: JSON.stringify(organizationViewModel),
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            console.log(data);
            if (data.id === undefined)
                ShowNotificationForUpdating(data);
            else
                swal({
                    title: "Успешно сохранено!",
                    icon: "success",
                    button: "Ok"
                }).then(() => {
                    $.each($('input, select, textarea'),
                        function (el) {
                            if (this.id === "")
                                return;

                            removeCookie(this.id);
                        });
                    window.location.href = `/Organizations/Organization/${data.id}`;
                });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            swal({
                title: "Неизвестная ошибка, обратитесь к администратору системы",
                icon: "error",
                button: "Ok"
            });

            return;
        },
        dataType: 'JSON'
    });
}

function PutOrganization(organizationViewModel) {
    $.LoadingOverlay("show");

    $.ajax({
        type: "PUT",
        url: `${api}/api/Organizations/${organizationViewModel.id}`,
        data: JSON.stringify(organizationViewModel),
        contentType: "application/json",
        success: function (data) {
            $.LoadingOverlay("hide");
            console.log(data);
            if (data === undefined)
                swal({
                    title: "Успешно сохранено!",
                    icon: "success",
                    button: "Ok"
                });
            else
                ShowNotificationForUpdating(data);
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному объекту!",
                    icon: "error",
                    button: "Ok"
                });
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok"
                });
            }

            return;
        },
        dataType: 'JSON'
    });
}

function clearRequiredFields() {
    $(`.organizationInfo input[required],
                .organizationInfo select[required],
					.organizationInfo textarea[required]`).each(function () {
        const element = $(this);
        if (getRequiredElementParentBlock(element)[0].classList.contains("required-field-group-highlighted"))
            getRequiredElementParentBlock(element)[0].classList.remove("required-field-group-highlighted");
    });

    formIsValid = true;
}

function checkRequiredFields() {
    $(`.organizationInfo input[required],
                .organizationInfo select[required],
					.organizationInfo textarea[required]`).each(function () {

        const element = $(this);

        switch (element.prop("tagName")) {
            case "INPUT":
                if (element.prop("type") === "checkbox") {
                    if (!element.prop("checked"))
                        highlightRequiredElementBlock(element);

                } else {
                    if (element.prop("type") === "button") {
                        if (element[0].form.innerText === "")
                            highlightRequiredElementBlock(element);
                    } else
                        if (element.val() === "")
                            highlightRequiredElementBlock(element);
                }
                break;

            case "SELECT":
                if (element.val() === null || Array.isArray(element.val()) && !element.val().length) {
                    highlightRequiredElementBlock(element);
                }
                break;

            case "TEXTAREA":
                if (element.val() === "")
                    highlightRequiredElementBlock(element);
                break;
        }
    });
}

var highlightRequiredElementBlock = (element) => {
    formIsValid = false;
    getRequiredElementParentBlock(element).addClass("required-field-group-highlighted");
};

var getRequiredElementParentBlock = (element) => {
    return element.closest("div.form-group");
};

var rememberField = (elementId) => {
    window.Cookies.remove('contact-' + elementId);
    window.Cookies.set('contact-' + elementId, $('#' + elementId).val(), { expires: 60 });
};

var removeCookie = (elementId) => {
    window.Cookies.remove('contact-' + elementId);
};

var getCookiesMultiple = (selectName) => {

    if (window.Cookies.get("contact-" + selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get("contact-" + selectName).split(',');

    if (cookieVal !== []) {
        var selector = '#' + selectName;
        $(selector).val(cookieVal);
    }
};

var getCookiesSingle = (selectName) => {

    if (window.Cookies.get("contact-" + selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get("contact-" + selectName);

    if (cookieVal !== undefined && cookieVal !== "") {
        var selector = '#' + selectName;

        if (cookieVal === "on")
            $(selector).prop('checked', true);

        $(selector).val(cookieVal);
    }
};

function ucFirst(el) {
    var str = $(el).val();

    if (!str) return str;

    $(el).val(str[0].toUpperCase() + str.slice(1));
}

function extendSortFunction() {

    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "ruDate-asc": function (a, b) {
            var ruDatea = $.trim(a).split('.');
            var ruDateb = $.trim(b).split('.');

            if (ruDatea[2] * 1 < ruDateb[2] * 1)
                return 1;
            if (ruDatea[2] * 1 > ruDateb[2] * 1)
                return -1;
            if (ruDatea[2] * 1 == ruDateb[2] * 1) {
                if (ruDatea[1] * 1 < ruDateb[1] * 1)
                    return 1;
                if (ruDatea[1] * 1 > ruDateb[1] * 1)
                    return -1;
                if (ruDatea[1] * 1 == ruDateb[1] * 1) {
                    if (ruDatea[0] * 1 < ruDateb[0] * 1)
                        return 1;
                    if (ruDatea[0] * 1 > ruDateb[0] * 1)
                        return -1;
                }
                else
                    return 0;
            }
        },

        "ruDate-desc": function (a, b) {
            var ruDatea = $.trim(a).split('.');
            var ruDateb = $.trim(b).split('.');

            if (ruDatea[2] * 1 < ruDateb[2] * 1)
                return -1;
            if (ruDatea[2] * 1 > ruDateb[2] * 1)
                return 1;
            if (ruDatea[2] * 1 == ruDateb[2] * 1) {
                if (ruDatea[1] * 1 < ruDateb[1] * 1)
                    return -1;
                if (ruDatea[1] * 1 > ruDateb[1] * 1)
                    return 1;
                if (ruDatea[1] * 1 == ruDateb[1] * 1) {
                    if (ruDatea[0] * 1 < ruDateb[0] * 1)
                        return -1;
                    if (ruDatea[0] * 1 > ruDateb[0] * 1)
                        return 1;
                }
                else
                    return 0;
            }
        }
    });
}