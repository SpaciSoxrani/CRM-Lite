async function FillFields(model, step) {

    let peoplesArray = await makePeopleInterestArray(model.peopleOfInterestDeals);
    $('#id').val(model.id);

    await FillNoLinksFields(model.hintVerificationStepClientsTasksAndNeeds, model.isRecurring, model.competitors, model.attachementsListId);

    await FillProbability(model.isProbable);

    window.InsertCloudLinks(model.cloudLinks);

    await FillResponsible(model.responsibleUser, model.responsibleUser.managerId);

    await FillOrganizationAndPeoples(model.organizationId, model.contactId, model.decisionMakerId, peoplesArray, step);

	await FillDepartments(model.salesDepartmentDealId, model.industrialDepartmentDealId, model.productUnitDeals, model.salesUnitDealId, model.industrialUnitDeals, model.dealTypeId, model.productLineDeals, step, model.isExported);

	await FillProcedure(model.selectionProcedureId, step);

    await FillIntervals(model.purchaseTimeIntervalId);

    await FillDealStatusName(model.dealStatus.name, model.dateToActivate);

    $('#verification-step-sales-departments').change(function () {

        var VSdep = $('#verification-step-sales-departments');
        var VSsec = $('#verification-step-sales-units');

        ChangeSalesDepartments(VSdep, VSsec);
        
    });

    $('#development-step-industrial-departments').change(function () {
        var DIsec = $('#development-step-industrial-units');
        var DPsec = $('#development-step-product-units');
        var DIdep = $('#development-step-industrial-departments');
        var dealType = $('#development-step-deal-type');
		var productLines = $('#development-step-product-line');

		if (DIdep.val() !== null && DIdep[0].selectedOptions[0].innerText === "ДВС")
			GetRequiredFieldsForDVS();
		else
			GetRequiredFieldsForDISAndDPS();

        if ($("#probability").val() === "20%") {
            ChangeIndustrialDepartments(DIdep, DIsec, DPsec);
            ChangeDealTypes(dealType, productLines, DIdep);
        }
    });

    $('#development-step-sales-departments').change(function () {

        var DSdep = $('#development-step-sales-departments');
        
        var DSsec = $('#development-step-sales-units');

        ChangeSalesDepartments(DSdep, DSsec);
    });

    $('#verification-step-product-line').on('change', GetSurvey);

	$("input, select").change(function () {
		getRequiredElementParentBlock($(this)).removeClass("required-field-group-highlighted");
	});
}

async function makePeopleInterestArray(peopleOfInterestDeals) {

    return peopleOfInterestDeals.map((p) => p.contactId);
}

async function FillDealStatusName(statusName, putOffDate) {

    let status = statusName;
    let dateToActivate = new Date(putOffDate).toLocaleDateString();
    let statusElem = $('.deal-status');
    if (statusName === "Отложенная") {
        status = statusName + " до " + dateToActivate;
        statusElem.each(function (index) { $(this).width('80%'); });
        statusElem.each(function (index) {
            $(this).closest('.form-inline').removeClass('col-2').addClass('col-3');
        });
    }

    if (statusName === "Закрытая \"Потеря\"" || statusName === "Закрытая \"Выигрыш\"") {
        statusElem.each(function (index) {
            $(this).closest('.form-inline').removeClass('col-2').addClass('col-3');
        });
    }

    $('.deal-status').val(status);

}

async function FillResponsible(responsibleUser, respManagerId) {

    var responsibleUsers = $('#verification-step-responsible');
    responsibleUsers.empty();

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            $.each(data, function (idx, a) {
                responsibleUsers.append(new Option(a.displayName, a.id));
            });
            responsibleUsers.val(responsibleUser.id);
            $('#responsible-name').val(responsibleUser.displayName);

            if (responsibleUser.id === user.id || respManagerId === user.i)
                responsibleUsers.removeAttr('disabled');
        }
    });	
}

function FillFields2Step(model) {

	$("#hint-development-step-define-work-group").prop('checked', model.hintDevelopmentStepDefineWorkGroup);
	$("#hint-development-step-define-vendors").prop('checked', model.hintDevelopmentStepDefineVendors);
	$("#hint-development-step-fill-in-production-claim").prop('checked', model.hintDevelopmentStepFillInProductionClaim);
	$("#hint-development-step-register-project-with-vendor").prop('checked', model.hintDevelopmentStepRegisterProjectWithVendor);
	$("#hint-development-step-work-through-defense-mechanisms").prop('checked', model.hintDevelopmentStepWorkThroughSpecialPricesMechanism);
	$("#hint-development-step-get-special-prices-from-vendor").prop('checked', model.hintDevelopmentStepRequestSpecialPricesFromVendor);
	$("#hint-development-step-work-through-tz").prop('checked', model.hintDevelopmentStepDevelopTKP);
	$("#hint-development-step-layout-updating").prop('checked', model.hintDevelopmentStepLayoutProject);
}

function FillFields3Step(model) {

	$("#hint-negotiating-step-meeting-with-customer").prop('checked', model.hintNegotiatingStepMeetingWithCustomer);
	$("#hint-negotiating-step-approve-specification-with-customer").prop('checked', model.hintNegotiatingStepApproveSpecificationWithCustomer);
	$("#hint-negotiating-step-approve-solution-architecture-with-customer").prop('checked', model.hintNegotiatingStepApproveSolutionArchitectureWithCustomer);
	$("#hint-negotiating-step-work-through-objections").prop('checked', model.hintNegotiatingStepWorkThroughObjections);
    $("#hint-negotiating-step-get-special-price-from-vendor").prop('checked', model.hintNegotiatingStepGetSpecialPricesFromVendor);
    $("#hint-negotiating-step-layout-updating").prop('checked', model.hintNegotiatingStepLayoutUpdating);
    $("#hint-negotiating-step-work-out-defense-mechanisms").prop('checked', model.hintNegotiatingStepWorkThroughDefenseMechanisms);
    $("#hint-negotiating-step-work-out-tz").prop('checked', model.hintNegotiatingStepWorkThroughTZ);
}

function FillFields4Step(model) {

	$("#hint-contest-step-get-contest-docs").prop('checked', model.hintContestStepGetContestDocs);
	$("#hint-contest-step-notify-host-team").prop('checked', model.hintContestStepNotifyHostTeam);
	$("#hint-contest-step-notify-vendors-team").prop('checked', model.hintContestStepNotifyVendorsTeam);
	$("#hint-contest-step-get-special-prices").prop('checked', model.hintContestStepGetSpecialPrices);

	$("#hint-contest-step-supply-conditions").prop('checked', model.hintContestStepSupplyConditions);
	$("#hint-contest-step-competitors-offers-worked-through").prop('checked', model.hintContestStepCompetitorsOffersWorkedThrough);
	$("#hint-contest-step-layout-with-risks").prop('checked', model.hintContestStepLayoutWithRisks);
	$("#hint-contest-step-contest-claim").prop('checked', model.hintContestStepContestClaim);
}

function FillFields5Step(model) {

	$("#hint-contract-signed-step-approve-project-with-vendor").prop('checked', model.hintContractSignedStepApproveProjectWithVendor);
	$("#hint-contract-signed-step-check-signing-procedure-format").prop('checked', model.hintContractSignedStepCheckSigningProcedureFormat);
	$("#hint-contract-signed-step-get-and-pass-provision").prop('checked', model.hintContractSignedStepGetAndPassProvision);

	$("#hint-contract-signed-step-pass-claim-for-service").prop('checked', model.hintContractSignedStepPassClaimForService);
	$("#hint-contract-signed-step-update-data-in-systems").prop('checked', model.hintContractSignedStepUpdateDataInSystems);
	$("#hint-contract-signed-step-format-sale-in-1c").prop('checked', model.hintContractSignedStepFormatSaleIn1C);
}

function FillFields6Step(model) {

	$("#hint-contract-works-step-supply-monitoring").prop('checked', model.hintContractWorksStepSupplyMonitoring);
	$("#hint-contract-works-step-payment-control").prop('checked', model.hintContractWorksStepPaymentControl);
	$("#hint-contract-works-step-pass-docs-to-accounting").prop('checked', model.hintContractWorksStepPassDocsToAccounting);
	$("#hint-contract-works-step-internal-project-reference").prop('checked', model.hintContractWorksStepInternalProjectReference);
    $("#hint-contract-works-step-discuss-project").prop('checked', model.hintContractWorksStepDiscussProject);

}

//fills
async function FillNoLinksFields(needs, repeat, comps, listId) {

	$("#hint-verification-step-clients-tasks-and-needs").val(needs);
	$("#verification-is-recurring").prop('checked', repeat);

	$("#verification-step-competitors").val(comps);
	$("#hint-negotiating-step-competitors").val(comps);
	$("#hint-contest-step-competitors").val(comps);
}

function FillMoney(step, budget, margin, expMargin, amount) {
	$("#verification-step-estimated-budget").val(budget);
	if (step > 1) {
		$("#development-step-estimated-budget").val(budget);
		$("#development-step-estimated-margin").val(margin);

		if (step > 2) {
			$("#hint-negotiating-step-estimated-budget").val(budget);
			$("#hint-negotiating-step-estimated-margin").val(margin);
			$("#hint-negotiating-step-expert-margin").val(expMargin);

			if (step > 3) {
                $("#hint-contest-step-expert-margin").val(expMargin);
                $("#hint-contest-step-estimated-margin").val(margin);
                $("#hint-contest-step-estimated-budget").val(budget);

				if (step > 4) {
					$("#hint-contract-signed-step-expert-margin").val(expMargin);
                    $("#hint-contract-signed-step-estimated-margin").val(margin);
                    $("#hint-contract-signed-step-deal-amount").val(amount);

                    if (step > 5) {
                        $("#hint-contract-works-step-expert-margin").val(expMargin);
                    }
				}
			}
		}
	}
}

function FillDates(stepNumber, vDate, closeDate, itogDate) {
	if (vDate !== null) {
        verificationSigningDateData.selectDate(new Date(vDate));
        if (stepNumber > 1)
            developmentSigningDateData.selectDate(new Date(vDate));
        if (stepNumber > 2) negotiateSigningDateData.selectDate(new Date(vDate));
        if (stepNumber > 3) contestSigningDateData.selectDate(new Date(vDate));
        if (stepNumber > 4) contractSigningDateData.selectDate( new Date(vDate));
	}

	if (closeDate !== null && closeDate !== undefined) {
        if (stepNumber > 1)
            developmentClosingDateData.selectDate(new Date(closeDate));
        if (stepNumber > 2) negotiateClosingDateData.selectDate(new Date(closeDate));
		if (stepNumber > 3) contestClosingDateData.selectDate(new Date(closeDate));
        if (stepNumber > 4) contractClosingDateData.selectDate(new Date(closeDate));
	}

    if (itogDate !== null && closeDate !== undefined) contestProcurementDateData.selectDate(new Date(itogDate));
}

async function FillProbability(probS) {
	// probability
	$.ajax({
		url: `${api}/api/DealProbability`,
		success: function (data) {
			var VProb = $('#verification-is-probable');
			var DProb = $('#development-is-probable');
			var NProb = $('#hint-negotiating-step-is-probable');
			var CProb = $('#hint-contest-step-is-probable');
			var CSProb = $('#hint-contract-signed-step-is-probable');

			$.each(data, function (idx, a) {
				VProb.append(new Option(a.value, a.key));
				DProb.append(new Option(a.value, a.key));
				NProb.append(new Option(a.value, a.key));
				CProb.append(new Option(a.value, a.key));
				CSProb.append(new Option(a.value, a.key));
			});
			if (probS === null) probS = "1";

			VProb.val(probS);
			DProb.val(probS);
			if (probS !== "1") {
				NProb.val(probS);
				CProb.val(probS);
			} else {
				NProb.val(2);
				CProb.val(2);
			}
            CSProb.val(3);

            $(".current-step-content").find('.is-probable').val(probS);
        }
	});
}

async function FillOrganizationAndPeoples(organization, contact, decision, peoplesOfInterest, stepNumber) {

	// organization
	$.ajax({
        url: `${location.origin}/Organizations/GetOrganizations`,
		success: function (data) {
            var organizations = $('#verification-step-organization');

			$.each(data, function (idx, a) {
				organizations.append(new Option(a.shortName, a.id));
				$("#organization").append(new Option(a.shortName, a.id));
            });

            if (organization !== null) {
                $('label[for=verification-step-organization]').html('<a href="/Organizations/Organization/' +
                    organization +
                    '" target="_blank">Организация</a>');
                $('label[for=organization]').html('<a href="/Organizations/Organization/' +
                    organization +
                    '" target="_blank">Организация</a>');
            }

            organizations.val(organization).trigger('change');
            $("#organization").val(organization).trigger('change');
            FillPeoples(contact, decision, peoplesOfInterest, stepNumber);

            $('#verification-step-organization').on('change', function () {
                FillPeoples(model.contactId, model.decisionMakerId, model.peopleOfInterest);
            });
		}
	});
}

function reloadContacts(organizationId, contact) {
    var opt = {
        "Контакты из организации": [],
        "Другие контакты": []
    };

    contact.empty();

    $.ajax({
        url: `${location.origin}/Contacts/Short`,
        async: false,
        success: function (data) {
            $.each(data, function (idx, a) {
                if (a.organizationId === organizationId) {
                    opt["Контакты из организации"].push(new Option(a.displayName, a.id));
                } else
                    opt["Другие контакты"].push(new Option(a.displayName, a.id));
            });

            window.EnableSearchingAnotherContacts([
                contact
            ], opt);
        }
    });
}

function FillPeoples(contact, decision, peoplesOfInterest, stepNumber) {
	let organizationId = $('#verification-step-organization').val();

	//decision
	var VdecisionField = $('#verification-step-decision-maker');
	var DdecisionField = $('#development-step-decision-maker');
	var NdecisionField = $('#hint-negotiating-step-decision-maker');

	//peoplesOfInterest
	var VPoI = $('#verification-step-people-of-interest');
	var NPoI = $('#hint-negotiating-step-people-of-interest');
	var CPoI = $('#hint-contest-step-people-of-interest');

    var contactsField = $('#verification-step-contact');
    var contactGeneralField = $("#contact");
    
    var organizationContacts = [];

    var opt = {
        "Контакты из организации": [],
        "Другие контакты": []
    };
        

	$.ajax({
        url: `${location.origin}/Contacts/Short`,
        success: function (data) {
            $.each(data, function (idx, a) {
                if (a.organizationId === organizationId) {
                    opt["Контакты из организации"].push(new Option(a.displayName, a.id));
                    organizationContacts.push(new Option(a.id, a.displayName));
                } else
                    opt["Другие контакты"].push(new Option(a.displayName, a.id));
            });

            window.EnableSearchingAnotherContacts([
                contactsField, VdecisionField, DdecisionField, NdecisionField, VPoI, NPoI, CPoI, contactGeneralField
            ], opt);

            if (contact !== null) {
                $('label[for=verification-step-contact]')
                    .html('<a href="/Contacts/Contact/' + contact + '" target="_blank">Контакт</a>');
                $('label[for=contact]')
                    .html('<a href="/Contacts/Contact/' + contact + '" target="_blank">Контакт</a>');
            }

            contactGeneralField.val(contact).trigger('change');
            //
            contactsField.val(contact).trigger('change');
            VdecisionField.val(decision).trigger('change');

            if (decision !== null)
                $('label[for=verification-step-decision-maker]').html('<a href="/Contacts/Contact/' + decision + '" target="_blank">Лицо, принимающее решение</a>');

            VPoI.val(peoplesOfInterest).trigger('change');
            if (stepNumber > 1) {
                DdecisionField.val(decision).trigger('change');
                if (decision !== null)
                    $('label[for=development-step-decision-maker]').html('<a href="/Contacts/Contact/' + decision + '" target="_blank">Лицо, принимающее решение</a>');
                if (stepNumber > 2) {
                    NdecisionField.val(decision).trigger('change');
                    if (decision !== null)
                        $('label[for=hint-negotiating-step-decision-maker]').html('<a href="/Contacts/Contact/' + decision + '" target="_blank">Лицо, принимающее решение</a>');
                    NPoI.val(peoplesOfInterest).trigger('change');
                    if (stepNumber > 3)
                        CPoI.val(peoplesOfInterest).trigger('change');
                }
            }
            else {
                DdecisionField.val(null);
                NdecisionField.val(null);
            }
           //
			contactsField.attr('disabled', 'disabled');
			VdecisionField.attr('disabled', 'disabled');
			VPoI.attr('disabled', 'disabled');

            if (($("#probability").val() === "10%") || ($("#probability").val() === "")) {

				if ($('#verification-step-organization').val() !== null) {
					contactsField.removeAttr('disabled');
					VdecisionField.removeAttr('disabled');
					VPoI.removeAttr('disabled');
				}
            }
        }
    });
}

async function FillDepartments(Sdep, Idep, Psect, Ssect, Isect, dealType, Line, stepNumber, isExported) {
    var VIdepartments = $('#verification-step-industrial-departments');
    var VSdepartments = $('#verification-step-sales-departments');
    var DIdepartments = $('#development-step-industrial-departments');
    var DSdepartments = $('#development-step-sales-departments');

	$.ajax({
		url: `${api}/api/GetActiveDepartments`,
		success: function (data) {			
            $.each(data, function (idx, a) {
                VIdepartments.append(new Option(a.name, a.id));
                VSdepartments.append(new Option(a.name, a.id));
                DIdepartments.append(new Option(a.name, a.id));
                DSdepartments.append(new Option(a.name, a.id));
            });

            VIdepartments.val(Idep).trigger('change');
            if (VIdepartments.val() !== null && VIdepartments[0].selectedOptions[0].innerText === "ДВС")
                GetRequiredFieldsForDVS();
            VSdepartments.val(Sdep).trigger('change');

			if (stepNumber > 1) {
				DIdepartments.val(Idep);
				DSdepartments.val(Sdep);
			}
			else {
				DIdepartments.val(null);
				DSdepartments.val(null);
			}

            FillUnitsOfIndustrialDepartment(Psect, Isect, stepNumber, isExported);
            FillUnitsOfSalesDepartment(Ssect, stepNumber);
            FillDealTypes(dealType, Line, VIdepartments, stepNumber);

            $('#verification-step-industrial-departments').change(function () {
                var VIdep = $('#verification-step-industrial-departments');
                var VPsec = $('#verification-step-product-units');
                var VIsec = $('#verification-step-industrial-units');
                var dealType = $('#verification-step-deal-type');
                var productLines = $('#verification-step-product-line');
                var show = document.getElementById("verification-step-file-show-survey");
                show.style.display = 'none';

                ChangeIndustrialDepartments(VIdep, VIsec, VPsec);
                ChangeDealTypes(dealType, productLines, VIdep);

            });
		}
	});
}

function FillUnitsOfSalesDepartment(Ssect, stepNumber) {
	let sDepId = $('#verification-step-sales-departments').val();

	var VSsections = $('#verification-step-sales-units');
	var DSsections = $('#development-step-sales-units');

	VSsections.attr('disabled', 'disabled').change();
	if (($("#probability").val() === "10%") || ($("#probability").val() === "")) {
		$('#verification-step-sales-departments').removeAttr('disabled');
        if ($('#verification-step-sales-departments').val() !== null) {
			VSsections.removeAttr('disabled');
		}
	}

	$.ajax({
		url: `${api}/api/GetProductAndSalesUnitsByParentDepartmentId/${sDepId}`,
        success: function (data) {
            VSsections.empty();
            DSsections.empty();
			$.each(data, function (idx, a) {
					if (a.canSell) {
						VSsections.append(new Option(a.name, a.id));
						DSsections.append(new Option(a.name, a.id));
					}				
			});
			
			VSsections.val(Ssect).change();

			if (stepNumber > 1) {
				DSsections.val(Ssect).change();
			}
			else {
				DSsections.val(null);
			}
		}
	});
}

function FillUnitsOfIndustrialDepartment(Psect, Isect, stepNumber, isExported) {
	let indDepId = $('#verification-step-industrial-departments').val();
	var VIsections = $('#verification-step-industrial-units');
    var DIsections = $('#development-step-industrial-units');
    var VPsections = $('#verification-step-product-units');
    var DPsections = $('#development-step-product-units');

	let array = [];
	for (let i = 0; i < Isect.length; i++)
        array.push(Isect[i].industrialUnitId);

    let productArray = [];
    for (let i = 0; i < Psect.length; i++)
        productArray.push(Psect[i].productUnitId);

    VIsections.attr('disabled', 'disabled').change();
    VPsections.attr('disabled', 'disabled').change();
	if (($("#probability").val() === "10%") || ($("#probability").val() === "")) {
        $('#verification-step-industrial-departments').removeAttr('disabled');
		if ($('#verification-step-industrial-departments').val() !== null) {
            $('#verification-step-product-line').removeAttr('disabled');
            $('#verification-step-deal-type').removeAttr('disabled');
            VIsections.removeAttr('disabled');
            VPsections.removeAttr('disabled');
		}
    }

	$.ajax({
		url: `${api}/api/GetIndustrialUnitsByParentDepartmentId/${indDepId}`,
        success: function(data) {
            VIsections.empty();
            DIsections.empty();
            VPsections.empty();
            DPsections.empty();
            $.each(data,
                function(idx, a) {
                    if (a.canProduct || isExported) {
                        VPsections.append(new Option(a.name, a.id));
                        DPsections.append(new Option(a.name, a.id));
                    }
                    if (a.canExecute || isExported) {
                        VIsections.append(new Option(a.name, a.id));
                        DIsections.append(new Option(a.name, a.id));
                    }
                });

            VIsections.val(array).trigger('change');
            VPsections.val(productArray).trigger('change');;

            if (stepNumber > 1) {
                $('#development-step-industrial-units').val(array);
                DPsections.val(productArray);
            } else {
                $('#development-step-industrial-units').val(null);
                DPsections.val(null);
            }
        }
	});
}

async function FillProcedure(proc, stepNumber) {
	$.ajax({
		// selectionsProc
		url: `${api}/api/SelectionProcedures`,
		success: function (data) {
			var VProc = $('#verification-step-contest-procedure')
			var CProc = $('#hint-contest-step-selection-procedure')
			$.each(data, function (idx, a) {
				VProc.append(new Option(a.name, a.id));
				CProc.append(new Option(a.name, a.id));
			});
			if (($("#probability").val() === "10%") || ($("#probability").val() === ""))
				VProc.removeAttr('disabled');
			if (stepNumber > 1)
				CProc.val(proc);
			else
				CProc.val(null);
			VProc.val(proc);
		}
	});
}

function FillDealTypes(Vtype, Line, Idep, stepNumber) {
	var VdealType = $('#verification-step-deal-type');
    var DdealType = $('#development-step-deal-type');

	VdealType.empty();
	DdealType.empty();
	$.ajax({
		//dealtypes
		url: `${api}/api/GetTypesByDepartmentId/${Idep.val()}`,
        success: function(data) {
            VdealType.empty();
            DdealType.empty();
			$.each(data, function (idx, a) {				
					VdealType.append(new Option(a.name, a.id));
					DdealType.append(new Option(a.name, a.id));	
			});

			VdealType.val(Vtype).trigger('change');
			if (stepNumber > 1)
				DdealType.val(Vtype).change();
			else
				DdealType.val(null);
		}
	});

	let array = []
    for (let i = 0; i < Line.length; i++)
        array.push(Line[i].productLineId);

	$.ajax({
		url: `${api}/api/GetLinesByDepartmentId/${Idep.val()}`,
		success: function (data) {
            $('#verification-step-product-line').empty();
            $('#development-step-product-line').empty();
			$.each(data, function (idx, a) {               
                    $('#verification-step-product-line').append(new Option(a.name, a.id));
                    $('#development-step-product-line').append(new Option(a.name, a.id));                
			});
			
            $('#verification-step-product-line').val(array).trigger('change');

            if (stepNumber > 1)
                $('#development-step-product-line').val(array).trigger('change');
            else
                $('#development-step-product-line').val(null);

			if (Line !== null)
				GetSurvey();
		}
	});
	if (($("#probability").val() === "10%") || ($("#probability").val() === "")) {
		if (Idep.val() !== null) {
			$('#verification-step-product-line').removeAttr('disabled');
			$('#verification-step-deal-type').removeAttr('disabled');
		} else {
			$('#verification-step-product-line').attr('disabled', 'disabled');
			$('#verification-step-deal-type').attr('disabled', 'disabled');
		}
	}


}

async function FillIntervals(time) {
	$.ajax({
		//PurchaseTimeIntervals
		url: `${api}/api/PurchaseTimeIntervals`,
		success: function (data) {
            var times = $('#verification-step-purchase-interval');
            var timesGeneral = $('#purchase-interval');
			$.each(data, function (idx, a) {
				times.append(new Option(a.name, a.id));
                timesGeneral.append(new Option(a.name, a.id));
            });

			if (($("#probability").val() === "10%") || ($("#probability").val() === ""))
                times.removeAttr('disabled');

            times.val(time).trigger('change');
            timesGeneral.val(time).trigger('change');
		}
	});
}

function FillHat(name, sName, money, Pmar, stepNumber, stepName) {

	$("#verification-step-name").val(sName);

	$("#name").val(name);
	$("#estimated-budget").val(money);
	$("#estimated-margin").val(Pmar);
	$("#step").val(stepName);
	//$("#probability").val(prob + '%');
	if (stepNumber === 1) $("#probability").val("10%");
	if (stepNumber === 2) $("#probability").val("20%");
	if (stepNumber === 3) $("#probability").val("40%");
	if (stepNumber === 4) $("#probability").val("60%");
	if (stepNumber === 5) $("#probability").val("90%");
	if (stepNumber > 5) $("#probability").val("100%");

}

function ChangeIndustrialDepartments(Idep, Isec, Psec) {
    var Icount = [];
    var Pcount = [];
	$.ajax({
		url: `${api}/api/GetIndustrialUnitsByParentDepartmentId/${Idep.val()}`,
        success: function(data) {
            Isec.empty();
            Psec.empty();
            $.each(data, function (idx, a) {
                if (a.canExecute) {
                    Icount.push(new Option(a.id, a.name));
                    Isec.append(new Option(a.name, a.id));
                }

                if (a.canProduct) {
                    Pcount.push(new Option(a.id, a.name));
                    Psec.append(new Option(a.name, a.id));
                }
            });

			if (Icount.length === 1) {
				var firstIsect = Icount[0].innerText;
				Isec.val(firstIsect);
			}
			else 
                Isec.val("");		

            if (Pcount.length === 1) {
                var firstPsect = Pcount[0].innerText;
                Psec.val(firstPsect);
            }
            else
                Psec.val("");

			if (Idep.val() !== null) 
				Isec.removeAttr('disabled');
			else 
                Isec.attr('disabled', 'disabled');

            if (Idep.val() !== null)
                Psec.removeAttr('disabled');
            else
                Psec.attr('disabled', 'disabled');	
		}
	});
}

function ChangeDealTypes(dealTypeId, productLineId, Idep) {

	var dealsCount = [];

	$.ajax({
		url: `${api}/api/GetTypesByDepartmentId/${Idep.val()}`,
		success: function (data) {
			///todo поменять
			dealTypeId.empty();

			$.each(data, function (idx, a) {				
					dealsCount.push(new Option(a.id, a.name));
					dealTypeId.append(new Option(a.name, a.id));				
			});
			if (dealsCount.length === 1) {
				var firstIsect = dealsCount[0].innerText;
				dealTypeId.val(firstIsect).trigger('change');
			}
			else {
				dealTypeId.val(null);
			}

            if (Idep.val() !== null) {
				dealTypeId.removeAttr('disabled');
			} else {
				dealTypeId.attr('disabled', 'disabled');
			}
		}
	});

	var productsCount = [];
	productLineId.empty();
	$.ajax({
		url: `${api}/api/GetLinesByDepartmentId/${Idep.val()}`,
		success: function (data) {
			$.each(data, function (idx, a) {			
					productsCount.push(new Option(a.id, a.name));
					productLineId.append(new Option(a.name, a.id));			
			});

			if (productsCount.length === 1) {
                var firstIsect = productsCount[0].innerText;
                productLineId.val(firstIsect).trigger('change');
            }
            else
                productLineId.val(null);

            if (Idep.val() !== null)
                productLineId.removeAttr('disabled');
            else
                productLineId.attr('disabled', 'disabled');
        }
    });
}

function ChangeSalesDepartments(Sdep, Ssec) {
	Ssec.empty();

	var Scount = [];

	$.ajax({
		url: `${api}/api/GetProductAndSalesUnitsByParentDepartmentId/${Sdep.val()}`,
		success: function (data) {
			$.each(data, function (idx, a) {
					if (a.canSell) {
						Ssec.append(new Option(a.name, a.id));
						Scount.push(new Option(a.id, a.name));
					}				
			});
            FillUnitsIfHaveOne(Scount, Ssec, Sdep);
        }
	});
}

function FillUnitsIfHaveOne(Scount, Ssec, Sdep) {

	if (Scount.length === 1) {
		var firstSsect = Scount[0].innerText;
		Ssec.val(firstSsect);
	}
	else
		Ssec.val("");

    if (Sdep.val() !== null) {
		Ssec.removeAttr('disabled');
	} else {
		Ssec.attr('disabled', 'disabled');
	}
}

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