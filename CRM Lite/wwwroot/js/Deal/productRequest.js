let vendorGuidSet = new Set();

function getModal() {
    if (window.model.industrialDepartmentDealId === null ||
        window.model.salesDepartmentDealId === null ||
        window.model.salesUnitDealId === null ||
        window.model.productLineDeals.length === 0 ||
        window.model.productUnitDeals.length === 0 ||
        window.model.industrialUnitDeals.length === 0) {
        swal({
            title: "Заполните обязательные поля на 1-2 этапе и сохраните сделку!",
            icon: "info",
            button: "Ok"
        });

        return;
    }

    var modal = new RModal(document.getElementById('productRequestModal'), {

		beforeOpen: function (next) {
			next();
		}

		, beforeClose: function (next) {
            $('.added-vendor').remove();
			next();
		}
	});

	document.addEventListener('keydown', function (ev) {
		modal.keydown(ev);
	}, false);

    $("#productRequestModal select").select2({
        placeholder: "Выберите элемент",
        allowClear: true
    });

	window.modal = modal;
	modal.open();
    fillRequest();
}

function fillRequest() {
	let departmentId = $('#verification-step-industrial-departments').val();

    $.ajax({
		url: `${api}/api/Departments/${departmentId}`,
		success: function (data) {
            if (data.name === "ДИС")
                fillVendors('');
            else
                FillResponsibleBeforeSelectVendor('');
        },
        xhrFields: {
            withCredentials: true
        }
	});	

	fillAdmAndTechContacts();
	fillAnotherResponsiblePeoples();

	$('#model-step-repeat').prop('checked', false);
	$('#model-step-quests').val("");
}

function AddVendor() {

	let content = $('#all-vendors');
    let id = content[0].children.length;

	content.append("<div class=\"row added-vendor\" style=\"padding: 0px 15px;\"> <div class=\"form-group col-md-4\" style =\"padding-top: 0px;\"><label for=\"" +
        "model-step-vendor" +
        "" + id + "\">Вендор</label>" +
		"<br />	<select class=\"form-control\" onchange=\"fillResponsiblePeoples('" + id + "');\" style=\"width:100%; height:2.5em;\" id=\"model-step-vendor" +  id + "\"></select>	</div>" +
		"<div class=\"form-group col-md-4\" style=\"padding-top: 0px;\"> <label for=\"model-step-responsible-product" + id + "\">Ответственный продакт</label>" +
		"<br />	<select class=\"form-control\" style=\"width:100%; height:2.5em;\" id=\"model-step-responsible-product" + id + "\"></select></div>" +
        "<div class=\"form-group col-md-4\" style =\"padding-top: 23px;\">" +
        "<input onclick=\"deleteAddedVendor(this)\" type=\"button\" class=\"btn btn-warning rounded\" value=\"Удалить\">" +
        "</div>" +
        "</div>");

    $("#model-step-vendor" + id + ", #model-step-responsible-product" + id).select2({
        placeholder: "Выберите элемент",
        allowClear: true
    });

    fillVendors(id);

	$("#steps-card select").select2({
		placeholder: "Выберите элемент",
		allowClear: true
	});
}

function deleteAddedVendor(element) {
    $(element).closest('.added-vendor').remove();
}

function saveRequest(start) {
    var requestModal = {};

    requestModal.isRepeatStatement = $('#model-step-repeat').prop('checked');
    requestModal.quests = [
        {
            quest: $('#model-step-quests').val()
        }
    ];
	requestModal.techContactId = $('#model-step-tech-contact').val();
	requestModal.admContactId = $('#model-step-adm-contact').val();

    let content = $('#all-vendors');

    let vendorsRequestDtos = [];

    for (let i = 0; i < content[0].children.length; i++) {

        var additionalNumber = i;

        if (i === 0)
            additionalNumber = '';

        if ($('#model-step-responsible-product' + additionalNumber).val() !== null) {
            vendorsRequestDtos.push({
                vendorId: $('#model-step-vendor' + additionalNumber).val(),
                responsibleId: $('#model-step-responsible-product' + additionalNumber).val()
            });
        }
    }

    requestModal.vendorsRequestDtos = vendorsRequestDtos;
    requestModal.anotherResponsiblesProductRequests = $('#model-step-another-responsible').val();
    requestModal.dealId = location.href.split('/')[location.href.split('/').length - 1];

    var isValid = true;

    if (start) {
        isValid = requestModal.quests[0].quest !== "" &&
            requestModal.techContactId !== null &&
            requestModal.admContactId !== null &&
            requestModal.vendorsRequestDtos.length !== 0;
    }

    if (isValid) {
        $.LoadingOverlay("show");

        if (start)
            $.ajax({
                type: "POST",
                url: `${api}/api/ProductRequests/Start`,
                data: JSON.stringify(requestModal),
                contentType: "application/json",
                success: function(data) {
                    $.LoadingOverlay("hide");

                    swal({
                        title: "Успешно отправлена!",
                        icon: "success",
                        button: "Ok"
                    }).then(() => {
                        $('.view-product-deals-btn').removeClass("d-none");
                        modal.close();
                        var href = location.origin + "/Deals/ProductRequests/" + requestModal.dealId;
                        window.open(href, '_blank').focus();
                    });
                },
                error: function(data) {
                    $.LoadingOverlay("hide");
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                    console.log(data);
                },
                dataType: 'JSON',
                xhrFields: {
                    withCredentials: true
                }
            });
        else
            $.ajax({
                type: "POST",
                url: `${api}/api/ProductRequests`,
                data: JSON.stringify(requestModal),
                contentType: "application/json",
                success: function(data) {
                    $.LoadingOverlay("hide");

                    swal({
                        title: "Успешно сохранено!",
                        icon: "success",
                        button: "Ok"
                    }).then(() => {
                        $('.view-product-deals-btn').removeClass("d-none");
                        modal.close();
                    });
                },
                error: function(data) {
                    $.LoadingOverlay("hide");
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                    console.log(data);
                },
                dataType: 'JSON',
                xhrFields: {
                    withCredentials: true
                }
            });
    }
	else {
        throwInvalidModelError();
    }
}

function throwInvalidModelError() {
    var ss = document.getElementById("error");
    if (ss.style.visibility === "visible") $('#error').toggle();
    ss.style.visibility = "visible";
    $('#error').fadeOut(4000);
}

function fillResponsiblePeoples(vendorCount) {

    var vendor = $('#model-step-vendor' + vendorCount);
    var responsible = $("#model-step-responsible-product" + vendorCount);

    $.ajax({
        url: `${api}/api/Vendors/${vendor.val()}`,
        success: function (data) {
            responsible.val(data.responsibleUserId).trigger("change");
        },
        xhrFields: {
            withCredentials: true
        }
    });

}

function fillAnotherResponsiblePeoples() {

    var anotherResponsible = $('#model-step-another-responsible');
	anotherResponsible.empty();
	$.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
		success: function (data) {
			$.each(data, function (idx, a) {
				anotherResponsible.append(new Option(a.displayName, a.id));
			});
			anotherResponsible.val("");
        },
        xhrFields: {
            withCredentials: true
        }
	});
}

function fillVendors(vendorCount) {

	var productLineId = $("#verification-step-product-line").val();
    var vendorElem = $('#model-step-vendor' + vendorCount);
	var vendorList = [];
    vendorElem.empty();

	$.ajax({
		url: `${api}/api/Vendors`,
		success: function (data) {
			$.each(data, function (idx, vendor) {
                if (productLineId.indexOf(vendor.productLineId) !== -1)
                    if (checkVendor(vendorList, vendor.name) && !vendorGuidSet.has(vendor.vendorGuid)) {
                        vendorElem.append(new Option(vendor.name, vendor.vendorGuid));
                        vendorGuidSet.add(vendor.vendorGuid);
                    }
            });
            vendorGuidSet.clear();
            vendorElem.val("");
        },
        xhrFields: {
            withCredentials: true
        }
	});
    FillResponsibleBeforeSelectVendor(vendorCount);
}

function FillResponsibleBeforeSelectVendor(vendorCount) {

    var responsible = $("#model-step-responsible-product" + vendorCount);

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function(data) {
            responsible.empty();
            $.each(data,
                function(idx, a) {
                    responsible.append(new Option(a.displayName, a.id));
                });
            responsible.val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });
}

function fillAdmAndTechContacts() {
    var opt = {
        "Контакты из организации": [],
        "Другие контакты": []
    };

	let organizationId = $('#verification-step-organization').val();
	var admCont = $("#model-step-adm-contact");
	var techCont = $("#model-step-tech-contact");
	admCont.empty();
    techCont.empty();

	$.ajax({
        url: `${location.origin}/Contacts/Short`,
		success: function (data) {
            $.each(data, function (idx, a) {
                if (a.organizationId === organizationId) {
                    opt["Контакты из организации"].push(new Option(a.displayName, a.id));
                } else
                    opt["Другие контакты"].push(new Option(a.displayName, a.id));
            });

            window.EnableSearchingAnotherContacts([
                admCont, techCont
            ], opt);

			admCont.val("");
			techCont.val("");
        },
        xhrFields: {
            withCredentials: true
        }
	});
}

function checkVendor(vendorList, name) {
	if (vendorList.indexOf(name) === -1) {
		vendorList.push(name);
		return true;
	}
	return false;
}
