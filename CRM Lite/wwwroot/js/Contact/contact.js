let formIsValid = true;
var model;
var addressId;

$(document).ready(function () {

    let id = location.href.split('/')[location.href.split('/').length - 1];
    let reasonOfCreating = location.href.split('/')[location.href.split('/').length - 2];

    if (id !== "Contact" && reasonOfCreating !== "ContactFromOrganization")
        $.ajax({
            type: "GET",
            url: `${api}/api/Contacts/${id}`,
            success: function (data) {
                addressId = data.addressId;
                model = data;
                GetFields(false);
                if (id !== "") FillFields();
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON'
        });
    else
        GetFields(true);

});

function cancelEdits() {
    let id = location.href.split('/')[location.href.split('/').length - 1];
    let reasonOfCreating = location.href.split('/')[location.href.split('/').length - 2];

    if (id === "Contact" || reasonOfCreating === "ContactFromOrganization")
        $(`.contactInfo input,
                .contactInfo select,
					.contactInfo textarea`).each(function () {

            const element = $(this);

            switch (element.prop("tagName")) {
            case "INPUT":
                if (element.prop("type") === "checkbox") {
                    if (element[0].id === "is-active")
                        element.prop('checked', true);

                    if (element[0].id === "is-mail-allowed")
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

function GetFields(importFromCookie) {
    if (importFromCookie) {
        $.each($('input, select, textarea'),
            function(el) {
                if (this.id === "")
                    return;

                if (this.multiple === true)
                    getCookiesMultiple(this.id);
                else
                    getCookiesSingle(this.id);
            });

        $.each($('input, select, textarea'),
            function(el) {
                if (this.id === "")
                    return;

                let selector = "#" + this.id;
                $(selector).change(function() {
                    rememberField(this.id);
                });
            });
    }

    $("#is-active").prop('checked', true);

    $.ajax({
        url: `${api}/api/genders`,
        success: function (data) {
            let gender = $('#gender');
            $.each(data, function (idx, a) {
                gender.append(new Option(a.name, a.id));
            });
            if (model !== undefined) {
                $("#gender").val(model.genderId);
            }

        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    $.ajax({
        type: "GET",
        url: `${api}/api/MarketingList/ForList`,
        success: function (data) {
            let list = $("#mailing-list");
            $.each(data, function (idx, a) {
                if (model !== undefined && model.marketingListContactIds.some(m => m === a.id))
                    list.append(new Option(a.name, a.id, true, true));
                else
                    list.append(new Option(a.name, a.id, false, false));
            });

            if (importFromCookie) 
                getCookiesMultiple("mailing-list");
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    $.ajax({
        url: `${api}/api/ContactRoles`,
        success: function (data) {
            let role = $('#role');
            $.each(data, function (idx, a) {
                role.append(new Option(a.name, a.id));
            });
            if (model !== undefined) {
                $("#role").val(model.roleId);
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    $.ajax({
        url: `${api}/api/Organizations/OrganizationsNames`,
        success: function (data) {
            let organizations = $('#organization');
            $.each(data, function (idx, a) {
                organizations.append(new Option(a.shortName, a.id));
            });

            if (importFromCookie) 
                getCookiesSingle("organization");

            if (organizationId !== undefined) {
                $("#organization").val(organizationId).trigger('change');
            } else if (model !== undefined) {
                $("#organization").val(model.organizationId).trigger('change');
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    $.ajax({
        url: `${api}/api/Interests`,
        success: function (data) {
            let interest = $('#interest');
            $.each(data, function (idx, a) {
                interest.append(new Option(a.name, a.id));
            });
            if (model !== undefined) {
                $("#interest").val(model.interestId);
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            let responsible = $('#responsible');
            $.each(data, function (idx, a) {
                responsible.append(new Option(a.displayName, a.id));
            });
            $("#responsible").val(user.id);
            if (model !== undefined && model.responsibleUserId) 
                $("#responsible").val(model.responsibleUserId);
            
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });
}

function FillFields() {
    $("#last-name").val(model.lastName);
    $("#gender").val(model.genderId).trigger("change");
    $("#role").val(model.roleId).trigger("change");
    $("#first-name").val(model.firstName);
    $("#email").val(model.email);

    if ($("#private-email")[0] !== undefined) {
        $("#private-email").val(model.privateEmail);
    }

    $("#workphone").val(model.workPhone);
    $("#are-addresses-equal").prop('checked', model.isAddressesEqual);
    $("#middle-name").val(model.middleName);
    $("#job-title").val(model.jobTitle);
    $("#department").val(model.department);
    $("#responsible").val(model.responsibleUserId);
    if (model.birthday !== null) $("#birthday").val(model.birthday.substring(0, 10));
    $("#mobilephone").val(model.mobilePhone);
    $("#assistant-name").val(model.assistantName);
    $("#assistant-phone").val(model.assistantPhone);
    $("#manager-name").val(model.managerName);
    $("#manager-phone").val(model.managerPhone);
    $("#notes").val(model.notes);
    $("#is-mail-allowed").prop('checked', model.isMailAllowed);
    $("#is-active").prop('checked', model.isActive);

    $.ajax({
        type: "GET",
        url: `${api}/api/Addresses/${model.addressId}`,
        success: function (data) {
            $("#country").val(data.country);
            $("#city").val(data.city);
            $("#region").val(data.region);
            $("#street").val(data.street);
            $("#index").val(data.zipCode);
            $("#building").val(data.building);
            $("#office").val(data.office);
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });
}

function saveContact() {

    clearRequiredFields();
    checkRequiredFields();

    if (!formIsValid) {
        swal({
            title: "Заполните необходимые поля!",
            type: "info",
            button: "Ok"
        });
        return;
    }

    var contactViewModel = {};

    if (model === undefined)
        contactViewModel.id = null;
    else
        contactViewModel.id = location.href.split('/')[location.href.split('/').length - 1];

    contactViewModel.lastName = $("#last-name").val();
    contactViewModel.firstName = $("#first-name").val();
    contactViewModel.email = $("#email").val();
    contactViewModel.privateEmail = "";

    if ($("#private-email")[0] !== undefined) {
        contactViewModel.privateEmail = $("#private-email").val();
    }
    else if (model !== null && model !== undefined)
        contactViewModel.privateEmail = model.privateEmail;

    contactViewModel.organizationId = $("#organization").val();
    contactViewModel.workPhone = $("#workphone").val();
    contactViewModel.middleName = $("#middle-name").val();
    contactViewModel.isAddressesEqual = $("#are-addresses-equal").prop("checked");
    contactViewModel.jobTitle = $("#job-title").val();
    contactViewModel.department = $("#department").val();
    contactViewModel.genderId = $("#gender").val();
    contactViewModel.birthday = null;
    if ($("#birthday").val() !== "") contactViewModel.birthday = $("#birthday").val();
    contactViewModel.roleId = $("#role").val();

    if (addressId !== null) contactViewModel.addressId = addressId;

    contactViewModel.address = {};

    if (addressId !== null) contactViewModel.address.id = addressId;

    contactViewModel.address.country = $("#country").val();
    contactViewModel.address.city = $("#city").val();
    contactViewModel.address.region = $("#region").val();
    contactViewModel.address.street = $("#street").val();
    contactViewModel.address.zipCode = $("#index").val();
    contactViewModel.address.building = $("#building").val();
    contactViewModel.address.office = $("#office").val();

    contactViewModel.responsibleUserId = $("#responsible").val();
    contactViewModel.mobilePhone = $("#mobilephone").val();
    contactViewModel.assistantName = $("#assistant-name").val();
    contactViewModel.assistantPhone = $("#assistant-phone").val();
    contactViewModel.managerName = $("#manager-name").val();
    contactViewModel.managerPhone = $("#manager-phone").val();
    contactViewModel.interestId = $("#interest").val();
    contactViewModel.notes = $("#notes").val();
    contactViewModel.marketingListContactIds = $("#mailing-list").val();
    contactViewModel.isMailAllowed = $("#is-mail-allowed").prop("checked");
    contactViewModel.isActive = $("#is-active").prop("checked");

    console.log(contactViewModel);
    console.log("contact saved");

    if (contactViewModel.id === null) {
        $.ajax({
            type: "GET",
            url: `${api}/api/Contacts/SearchForDuplicate?firstName=${contactViewModel.firstName}&lastName=${contactViewModel.lastName}&city=${contactViewModel.address.city}&mobilePhone=${contactViewModel.mobilePhone}`,
            success: function (data) {
                postContact(contactViewModel);
            },
            error: function (data) {
                if (data.status === 409) {
                    notifyContactExists(data.responseJSON, contactViewModel);
                } else {
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        type: "error",
                        button: "Ok"
                    });
                }
                return;
            },
            dataType: 'JSON'
        });
    }
    else
        putContact(contactViewModel);
}

var notifyContactExists = (data, contactViewModel) => {

    let contactTableTags =
        "<table cellpadding=\"7\"><thead><tr><th>ФИО</th><th>Организация</th><th>Телефон</th></tr></thead><tbody></tbody></table>";
    swal({
        title: "Контакты с такими полями уже есть!",
        type: "info",
        html: contactTableTags,
        showCancelButton: true,
        onOpen: () => {
            const contactTable = swal.getContent();
            if (contactTable) {
                var tbody = contactTable.querySelector('tbody');

                data.forEach(contact => {

                    contact.organization = contact.organizationShortName === "" ? "Не указана" : contact.organizationShortName;
                    contact.mobilePhone = contact.mobilePhone === "" ? "Не указан" : contact.mobilePhone;

                    let contactInfo = '<tr>' +
                        '<td style=\'margin: 0 20px ;\'>' +
                        '<a href=\'/Contacts/Contact/' + contact.id + '\'>' + contact.firstName + ' ' + contact.lastName + '</a>' +
                        '</td>' +
                        '<td style=\'margin: 0 20px;\'>' + contact.organization + '</td>' +
                        '<td style=\'margin: 0 20px;\'>' + contact.mobilePhone + '</td>' +
                        '</tr>';

                    tbody.innerHTML += contactInfo;
                });
            }
        },
        confirmButtonText: "Всё равно создать",
        cancelButtonText: "Отмена"
    }).then((value) => {
        if (value.dismiss === 'cancel')
            return;
        if (value)
            postContact(contactViewModel);
    });
};

var postContact = (contactViewModel) => {
    $.LoadingOverlay("show");
    $.ajax({
        type: "POST",
        url: `${api}/api/Contacts`,
        data: JSON.stringify(contactViewModel),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
            $.LoadingOverlay("hide");

            $.each($('input, select, textarea'),
                function (el) {
                    if (this.id === "")
                        return;

                    removeCookie(this.id);
                });

            swal({
                title: "Успешно сохранено!",
                type: "success",
                button: "Ok"
            }).then(() => {
                window.location.href = `/Contacts/Contact/${data.id}`;
            });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному объекту!",
                    type: "error",
                    button: "Ok"
                });
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    type: "error",
                    button: "Ok"
                });
            }
            return;
        },
        dataType: 'JSON'
    });
};

var putContact = (contactViewModel) => {
    $.LoadingOverlay("show");
    $.ajax({
        type: "PUT",
        url: `${api}/api/Contacts/${contactViewModel.id}`,
        data: JSON.stringify(contactViewModel),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
            $.LoadingOverlay("hide");
            swal({
                title: "Успешно сохранено!",
                type: "success",
                button: "Ok"
            });
        },
        error: function (data) {
            $.LoadingOverlay("hide");
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному объекту!",
                    type: "error",
                    button: "Ok"
                });
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    type: "error",
                    button: "Ok"
                });
            }
            return;
        },
        dataType: 'JSON'
    });
};

function clearRequiredFields() {
    $(`.contactInfo input[required],
                .contactInfo select[required],
					.contactInfo textarea[required]`).each(function () {
        const element = $(this);
        if (getRequiredElementParentBlock(element)[0].classList.contains("required-field-group-highlighted"))
            getRequiredElementParentBlock(element)[0].classList.remove("required-field-group-highlighted");
    });

    formIsValid = true;
}

function checkRequiredFields() {
    $(`	.contactInfo input[required],
			.contactInfo select[required],
				.contactInfo textarea[required]`).each(function () {

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
        let selector = '#' + selectName;
        $(selector).val(cookieVal);
    }
};

var getCookiesSingle = (selectName) => {

    if (window.Cookies.get("contact-" + selectName) === undefined)
        return;

    var cookieVal = window.Cookies.get("contact-" + selectName);

    if (cookieVal !== undefined && cookieVal !== "") {
        let selector = '#' + selectName;

        if (cookieVal === "on")
            $(selector).prop('checked', true);

        $(selector).val(cookieVal);
    }
};

function ucFirst(el) {
    let str = $(el).val();

    if (!str) return str;

    $(el).val(str[0].toUpperCase() + str.slice(1));
}
