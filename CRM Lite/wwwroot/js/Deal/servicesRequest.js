var contractDateData;

function getServicesModal(number) {

    let indDepartmentId = $('#verification-step-industrial-departments');
    let saleDepartmentId = $('#verification-step-sales-departments');
    let saleUnitId = $('#verification-step-sales-units');
    let productUnitId = $('#verification-step-product-units');
    let industrialUnitId = $('#verification-step-industrial-units');
    let productWays = $('#verification-step-product-line');

    if (indDepartmentId.val() === null || (Array.isArray(indDepartmentId.val()) && !indDepartmentId.val().length) ||
        saleDepartmentId.val() === null || (Array.isArray(saleDepartmentId.val()) && !saleDepartmentId.val().length) ||
        saleUnitId.val() === null || (Array.isArray(saleUnitId.val()) && !saleUnitId.val().length) ||
        productUnitId.val() === null || (Array.isArray(productUnitId.val()) && !productUnitId.val().length) ||
        productWays.val() === null || (Array.isArray(productWays.val()) && !productWays.val().length) ||
        industrialUnitId.val() === null || (Array.isArray(industrialUnitId.val()) && !industrialUnitId.val().length)) {
        swal({
            title: "Заполните обязательные поля на 1-2 этапе и сохраните сделку!",
            icon: "info",
            button: "Ok"
        });

        return;
    }

	var modal = new RModal(document.getElementById('modal' + number), {
        beforeOpen: function (next) {
            var contractDate = $('#model-step-contract-date' + number).datepicker({
                todayButton: new Date(),
                autoClose: true
            });

            contractDateData = contractDate.datepicker().data('datepicker');

			next();
		}

		, beforeClose: function (next) {
			next();
		}
	});

	document.addEventListener('keydown', function (ev) {
		modal.keydown(ev);
	}, false);

	window.modal = modal;
	modal.open();
	fillServiceRequest(number);
}

function fillServiceRequest(number) {
	fillIndustrialUnits(number);
	fillAnoterParticipants(number);
	$('#model-step-contract-number' + number).val(null);
    $('#model-step-score-number' + number).val(null);
    $('#model-step-contract-date' + number).val(null);
    $('#model-step-document-for-service' + number).val(null);
	$('#model-step-services' + number).val(null);
	$('#model-step-important-condition' + number).val(null);
	startServicesTime();
}

function fillIndustrialUnits(number) {
	let industrialDepartment = $('#development-step-industrial-departments');
	let industrialUnits = $('#model-step-industrial-unit' + number);
	let unitValues = $('#development-step-industrial-units').val();
	var industrialUnitArray = [];
	industrialUnits.empty();

	$.ajax({
		url: `${api}/api/GetIndustrialUnitsByParentDepartmentId/${industrialDepartment.val()}`,
		success: function (data) {
			$.each(data, function (idx, a) {				
					industrialUnitArray.push(new Option(a.id, a.name));
					industrialUnits.append(new Option(a.name, a.id));				
			});			
			industrialUnits.val(unitValues);			
        },
        xhrFields: {
            withCredentials: true
        }
	});	
}

function fillAnoterParticipants(number) {
	var anotherResponsible = $('#model-step-another-responsible' + number);
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

function saveServicesRequest(number, isStarted) {
    $('.create-request-button').attr('disabled', 'true');

	var requestModal = {};
	requestModal.preparationDate = new Date();
    requestModal.industrialUnits = $('#model-step-industrial-unit' + number).val();
    requestModal.contractDate = contractDateData.selectedDates[0] === undefined ? null : contractDateData.selectedDates[0].toDateString();
    requestModal.isStarted = isStarted;

    if (!isStarted || requestModal.industrialUnits.length !== 0)
        $('#model-step-industrial-unit' + number).addClass('is-valid');
    else {
        $('#model-step-industrial-unit' + number).addClass('is-invalid');
        $('.create-request-button').removeAttr('disabled');
        return;
    }

    requestModal.anotherResponsibles = $('#model-step-another-responsible' + number).val();

    requestModal.contractNumber = $('#model-step-contract-number' + number).val();
    requestModal.scoreNumber = $('#model-step-score-number' + number).val();
    requestModal.serviceDocument = $('#model-step-document-for-service' + number).val();

    if (!isStarted || (requestModal.contractNumber !== "" ||
        requestModal.scoreNumber !== "" ||
        requestModal.serviceDocument !== "")) {
        $('#model-step-contract-number' + number).addClass('is-valid');
        $('#model-step-score-number' + number).addClass('is-valid');
        $('#model-step-document-for-service' + number).addClass('is-valid');
    } else {
        $('#model-step-contract-number' + number).addClass('is-invalid');
        $('#model-step-score-number' + number).addClass('is-invalid');
        $('#model-step-document-for-service' + number).addClass('is-invalid');
        $('.create-request-button').removeAttr('disabled');
        return;
    }

    requestModal.service = $('#model-step-services' + number).val();

    if (!isStarted || requestModal.service !== "")
        $('#model-step-services' + number).addClass('is-valid');
    else {
        $('#model-step-services' + number).addClass('is-invalid');
        $('.create-request-button').removeAttr('disabled');
        return;
    }

    requestModal.importantCondition = $('#model-step-important-condition' + number).val();

	requestModal.dealName = $('#name').val();
	requestModal.organizationId = $('#organization').val();
	requestModal.responsibleUserId = this.window.user.id;

    if (location.href.split('/')[location.href.split('/').length - 1] !== "Deal")
        requestModal.dealId = location.href.split('/')[location.href.split('/').length - 1];

    if (requestModal.serviceDocument !== "" && $('#basis-for-service-request input')[0].form.innerText === "" &&
        requestModal.contractNumber === "" && requestModal.scoreNumber === "") {

        $('#model-step-document-for-service' + number).after(`<div class="invalid-feedback">
                                                                    Добавьте документ к сделке
                                                                </div>`);

        $('#model-step-document-for-service' + number).addClass('is-invalid');
        $('.create-request-button').removeAttr('disabled');
        $('#model-step-document-for-service' + number).closest('.invalid-feedback').fadeOut(4000);
        return;
    }

    if (!isStarted || (requestModal.industrialUnits.length !== 0 &&
        (requestModal.contractNumber !== "" || requestModal.scoreNumber !== "" || requestModal.serviceDocument !== "") &&
        requestModal.service !== "")) {
        $.ajax({
            type: "POST",
            url: `${api}/api/ServicesRequests`,
            data: JSON.stringify(requestModal),
            contentType: "application/json",
            success: function (data) {
                $('.create-request-button').removeAttr('disabled');
                $.LoadingOverlay("hide");
                $('.view-service-deals-btn').removeClass('d-none');

                if(isStarted)
                    swal({
                        title: "Успешно отправлена!",
                        icon: "success",
                        button: "Ok"
                    }).then(() => {
                        var href = location.origin + "/Deals/ServicesRequests/" + requestModal.dealId;
                        modal.close();
                        window.open(href, '_blank').focus();
                    });
                else
                    swal({
                        title: "Успешно сохранено!",
                        icon: "success",
                        button: "Ok"
                    });

            },
            error: function (data) {
                alert("Ошибка при сохранении");
                $.LoadingOverlay("hide");
                $('.create-request-button').removeAttr('disabled');
                console.error(data);
            },
            dataType: 'JSON',
            xhrFields: {
                withCredentials: true
            }
        }).done(function () {
            fillServiceRequest(number);
            document.getElementById('close').onclick();
        });
    }
    else {
        var ss = document.getElementById("error" + number);
        if (ss.style.visibility === "visible") $('#error' + number).toggle();
        ss.style.visibility = "visible";
        $('.create-request-button').removeAttr('disabled');
        $('#error' + number).fadeOut(4000);
    }
}

function startServicesTime() {
	var date = new Date();

	var dd = date.getDate();
	var mm = date.getMonth() + 1;
	var yy = date.getFullYear() % 100;
	var h = date.getHours();
	var m = date.getMinutes();

	dd = checkTime(dd);
	mm = checkTime(mm);
	yy = checkTime(yy);
	m = checkTime(m);
	h = checkTime(h);
	document.getElementById('model-step-date3').innerHTML = dd + '.' + mm + '.' + yy + ' ' + h + ":" + m;
	document.getElementById('model-step-date4').innerHTML = dd + '.' + mm + '.' + yy + ' ' + h + ":" + m;
	t = setTimeout('startTime', 7000);
}