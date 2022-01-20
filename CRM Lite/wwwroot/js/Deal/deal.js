let formIsValid = true;
let firstStepIsValid = true;
let isExported = false;
var ajaxStop = true;
var model;

$(document).ready(function () {	
	$(`#steps-card-body .tab-content .tab-pane:not(.current-step-content) input,
                 #steps-card-body .tab-content .tab-pane:not(.current-step-content) select`).not('.upload-btn').each(function () {

		const element = $(this);
		element.prop('disabled', true);
		element.css('pointer-events', 'none');
	});

    enableCloudLinks();

    $("#steps-card select").select2({
		placeholder: "Выберите элемент",
		allowClear: true
	});

	var id = location.href.split('/')[location.href.split('/').length - 1];
	var stepNumber = 1;
    $('.date-to-activate').hide();

    if ((id === "Deal") || (id === "")) {
		LoadEmptyDeal();
        setDropzone();
        $(".put-off-and-close").hide();
    }
	else {
		$.ajax({
			type: "GET",
            url: `${api}/api/Deals/${id}/${user.id}`,
            xhrFields: {
                withCredentials: true
            },
			success: function (data) {
				model = data;
                stepNumber = model.step.orderNumber;
                isExported = model.isExported;

                FillHat(model.name, model.shortName, thousandSeparator(model.estimatedBudget), thousandSeparator(model.estimatedMargin), stepNumber, model.step.name);
				
				FillDates(stepNumber, model.contractSigningDate, model.contractClosureDate, model.procurementProcedureResultsDate);
                FillMoney(stepNumber, thousandSeparator(model.estimatedBudget), thousandSeparator(model.estimatedMargin), thousandSeparator(model.estimatedRealMargin), thousandSeparator(model.amountOfDeal));

                FillFields(model, stepNumber).catch((err) => {
                    console.error(err);
                });

                $(document).ajaxStop(function () {
                    if (ajaxStop) {
                        actionsOnClosingAndPutOffDeal(stepNumber, model);
                        setDropzone();
                        ajaxStop = false;
                    }
                });

                $('#verification-step-name').prop('disabled', !model.isMergedFromInterest);
                enableFields([
                    '#verification-step-purchase-interval',
                    '#verification-step-responsible',
                    '#verification-step-sales-units',
                    '#verification-step-product-units',
                    '#verification-step-industrial-units',
                    '#verification-step-product-line',
                    '#name'
                ]);

                var closingDateField = '';

                if (stepNumber > 1) {
                    closingDateField = '#development-step-closing-date';
                    FillFields2Step(model);
                    if (stepNumber > 2) {
                        closingDateField = '#hint-negotiating-step-closing-date';
                        FillFields3Step(model);
                        if (stepNumber > 3) {
                            closingDateField = '#hint-contest-step-closing-date';
                            FillFields4Step(model);
                            if (stepNumber > 4) {
                                closingDateField = '#hint-contract-signed-step-closing-date';
                                FillFields5Step(model);
                                if (stepNumber > 5) {
                                    $('.put-off-deal').removeClass('col').hide();
                                    FillFields6Step(model);
                                }
                            }
                        }
                    }
                }

                $(closingDateField).prop('disabled', false);
                $(closingDateField).css('pointer-events', 'auto');
			},
			error: function (data) {
                if (data.status === 403) {
                    swal({
                        title: "У Вас нет доступа к данному объекту!",
                        icon: "error",
                        button: "Ok"
                    }).then(() => {
                        window.location.href = location.origin;
                    });
                    return;
                } else {
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                    window.location.href = location.origin;
                }
			},
			dataType: 'JSON'
		});
    }

    $('#express').on("click", function () {
        swal({
            title: "Вы уверены, что хотите провести экспресс-сделку?",
            type: "info",
            icon: "info",
            buttons: ["Отмена", "Да!"],
        }).then((value) => {
            if (value.dismiss === 'cancel')
                return;
            if (value)
                expressDeal(stepNumber);
        });
       
    });
});

function copyDealName() {
    const dealName = $('#name').val() + " " + location.href;

    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(dealName).select();
    document.execCommand("copy");
    $temp.remove();

    $('.copy-esg-value').fadeOut('slow', function () {
        $(this).fadeIn('slow', function () {

        });
    });
}

function enableFields(fieldNames) {
    fieldNames.forEach(name => {
        $(name).prop('disabled', false);
    });
}

function actionsOnClosingAndPutOffDeal(stepNumber, model) {

    isExpressButtonShown(stepNumber, stepNumber);

    if (model.isExported) {
        $(`#steps-card-body .tab-content .tab-pane:not(.current-step-content) input,
                 #steps-card-body .tab-content .tab-pane:not(.current-step-content) select`).each(function () {

            const element = $(this);
            element.prop('disabled', false);
            element.css('pointer-events', '');
                 });

        $(`#steps-card-body .tab-content .tab-pane:not(.current-step-content) input,
        #steps-card-body .tab-content .tab-pane:not(.current-step-content) .switch,
        #steps-card-body .tab-content .tab-pane:not(.current-step-content) .select2-selection__rendered,
        #steps-card-body .tab-content .tab-pane:not(.current-step-content) .select2-selection`).prop('cursor', 'auto');

        if (!$('#verification-step-organization').val())
            $('#verification-step-organization').prop('disabled', false);
        else
            $('#verification-step-organization').prop('disabled', true);

        $('#verification-step-name').prop('disabled', true);

        $('#verification-step-contact').prop('disabled', false);
        $('#verification-step-responsible').prop('disabled', false);
    }

    if (model.isAbleToClose === true) {
        $(".finish-deal").removeClass('col').hide();
        $(".accept-closing-deal").show();
    }

    if (model.dealStatus.name !== "Активная") {
        $('input, select, textarea').attr('disabled', 'disabled');
        $('.additional-files, .additional-files input').removeAttr('disabled');
        
        $(".accept-closing-deal").hide();
        $('.file-window').removeAttr('disabled');
        if (model.dealStatus.name === "Отложенная") {
            $('.reopen-deal').show().removeAttr('disabled');
            $('.put-off-deal').removeClass('col').hide();
            $(".status").removeClass("col-3");
            let dateToActivate = new Date(model.dateToActivate).toLocaleDateString();
            $('.deal-date-activate').val(dateToActivate);
        }
        if (model.dealStatus.name === "Закрытая \"Потеря\"" || model.dealStatus.name === "Закрытая \"Выигрыш\"") {
            $(".put-off-and-close").removeClass('col-auto').hide();
            $(".files-on-closed-step").show().removeAttr('disabled');
            $(".status").removeClass('col-auto col-3');
        }
        $('.deal-status').parent().attr('title', model.commentToFailDeal);
        $('.deal-status').parent().tooltip();
    }
    enableGrantAccess()
    loadDealStatuses(stepNumber);
}

var isExpressButtonShown = (stepNumber, currentStep) => {
    var exp = document.getElementById("express");
    if (exp) {
        exp.style.display = "none";

        if ($($(".active[role=tab]")[0]).hasClass("current-step-link") && stepNumber > 3)
            exp.style.display = "none";
        if (stepNumber < 4)
            exp.style.display = "inline-block";
        if (currentStep > 3)
            exp.style.display = "none";
    }
};

function enableGrantAccess() {
    $('#giveAccessToDeal').attr('disabled', false);
    $('#modal-give-access').find('input, select').each(function () {
        $(this).attr('disabled', false);
    });
}

function closeDealSuccessfully() {
    checkDealBeforeSave(true);

    var dealName = $("#name").val();
    dealName = dealName.replace(/^\s+|\s+$/g, '');

    if (!firstStepIsValid) {
        swal({
            title: "Заполните все обязательные поля на 1-2 этапе сделки!",
            icon: "info",
            button: "Ok"
        });
        return;
    }

    if ($("#id").val() !== "" && !dealName) {
        swal({
            title: "Заполните название сделки!",
            icon: "info",
            button: "Ok"
        });
        return;
    }

    if (!formIsValid) {
        swal({
            title: "Заполните необходимые поля!",
            icon: "info",
            button: "Ok"
        });
        return;
    }

    modalCloseDeal.open();
}

function checkDealBeforeSave(nextStep) {
    clearRequiredFields();

    if (nextStep)
        checkRequiredFields();

    if (isExported)
        checkFieldsForFirstStep();

    if ($("#id").val() === "")
        checkFieldsForFirstStep();
}

function saveDeal(nextStep) {

    checkDealBeforeSave(nextStep);

    if (!firstStepIsValid) {
        swal({
            title: "Заполните все обязательные поля на 1-2 этапе сделки!",
            icon: "info",
            button: "Ok"
        });
        return;
    }

    var dealName = $("#name").val();
    dealName = dealName.replace(/^\s+|\s+$/g, '');

    if ($("#id").val() !== "" && !dealName) {
        swal({
            title: "Заполните название сделки!",
            icon: "info",
            button: "Ok"
        });
        return;
    }

	if (!formIsValid) {
		swal({
			title: "Заполните необходимые поля!",
			icon: "info",
			button: "Ok"
		});
		return;
    }
    $.LoadingOverlay("show");
	let dealViewModel = GetDealViewModel();
	isDVS = false;
    if ($('#verification-step-industrial-departments').val() !== null && $('#verification-step-sales-departments').val() !== null)
        if ($('#verification-step-industrial-departments')[0].selectedOptions[0].innerText === "ДВС" && $('#verification-step-sales-departments')[0].selectedOptions[0].innerText === "ДВС")
			isDVS = true;
	dealViewModel.isDVS = isDVS;
	dealViewModel.nextStep = nextStep;

	$.ajax({
		type: "POST",
		url: `${api}/api/Deal`,
		data: JSON.stringify(dealViewModel),
		contentType: "application/json",
        success: function (data) {
                    if (!nextStep)
                        swal({
                            title: "Успешно сохранено!",
                            icon: "success",
                            button: "Ok"
                        }).then(() => {
                            GetDealName(dealViewModel, data);
                        });
                    else
                        GetDealName(dealViewModel, data);
			
		},
		error: function (data) {
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному объекту!",
                    icon: "error",
                    button: "Ok"
                }).then(() => {
                    window.location.href = location.origin;
                });
                return;
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok",
                });
                return;
            }
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

function expressDeal(stepNumber) {
	clearRequiredFields();
	formIsValid = true;

	if (stepNumber === 1)
		checkRequiredFields();

	if (!formIsValid) {
		swal({
			title: "Заполните необходимые поля!",
			icon: "info",
			button: "Ok",
		});
		return;
	}

	let dealViewModel = GetDealViewModel();
	dealViewModel.nextStep = false;
    dealViewModel.isDVS = false;

    $.LoadingOverlay("show");

	$.ajax({
		type: "POST",
		url: `${api}/api/ExpressDeal`,
		data: JSON.stringify(dealViewModel),
		contentType: "application/json",
        success: function (data) {
            GetDealName(dealViewModel, data);
        },
		error: function (data) {
			alert(data);
		},
        dataType: 'JSON',
        complete: function () {
            $.LoadingOverlay("hide");
        },
        xhrFields: {
            withCredentials: true
        }
    });
}