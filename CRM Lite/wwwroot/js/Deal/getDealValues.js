function GetDealViewModel() {
	var dealViewModel = {};
	// собираем форму
	dealViewModel.id = $("#id").val();
	dealViewModel.createdDate = $("#created-date").val();
	dealViewModel.changedDate = $("#changed-date").val();

	dealViewModel.isRecurring = $("#verification-is-recurring").prop("checked");
    dealViewModel.stepId = $("#pills-verification-tab").val();
    dealViewModel.href = location.href;
	dealViewModel.stepId = $("#step").val();
	if (dealViewModel.stepId === null) dealViewModel.stepId = "";


	// todo: заполнять текущим юзером в контроллере, когда будет настроена связка - userId-windowsIdentity
	//dealViewModel.responsibleUserId
	dealViewModel.probability = "10%"
	if ($("#probability").val() != "") dealViewModel.probability = $("#probability").val();
	dealViewModel.isProbable = $("#hint-contract-signed-step-is-probable").val();

	// Автогенерируемое поле. Если "", значит сделка только создается и надо его сгенерить.
	dealViewModel.name = $("#name").val();

    dealViewModel.shortName = $("#verification-step-name").val();
	// Организация и контакт (как и название сделки) заполняются только на первом этапе, поэтому берем оттуда.
	dealViewModel.contactId = $("#verification-step-contact").val();
	dealViewModel.organizationId = $("#verification-step-organization").val();
	//dealViewModel.organizationId = $("#verification-step-contact").val();
    dealViewModel.responsibleUserId = $('#verification-step-responsible').val();

    dealViewModel.productLineId = $("#verification-step-product-line").val();
    if ($("#development-step-product-line").val().length != 0) dealViewModel.productLineId = $("#development-step-product-line").val();

	dealViewModel.dealTypeId = $("#verification-step-deal-type").val();
    if ($("#development-step-deal-type").val() != null) dealViewModel.dealTypeId = $("#development-step-deal-type").val();

    dealViewModel.productLine = $("#verification-step-product-line").val();
    if ($("#development-step-product-line").val().length != 0) dealViewModel.productLine = $("#development-step-product-line").val();

	dealViewModel.competitors = $("#verification-step-competitors").val();
	if ($("#hint-negotiating-step-competitors").val() != "") dealViewModel.competitors = $("#hint-negotiating-step-competitors").val();
	if ($("#hint-contest-step-competitors").val() != "") dealViewModel.competitors = $("#hint-contest-step-competitors").val();

	dealViewModel.peopleOfInterest = $("#verification-step-people-of-interest").val();
	if ($("#hint-negotiating-step-people-of-interest").val() != "") dealViewModel.peopleOfInterest = $("#hint-negotiating-step-people-of-interest").val();
	if ($("#hint-contest-step-people-of-interest").val() != "") dealViewModel.peopleOfInterest = $("#hint-contest-step-people-of-interest").val();

    dealViewModel.closureDate = $('#closure-date-success').val();
    dealViewModel.contractSigningDate = verificationSigningDateData.selectedDates[0] === undefined ? "" : verificationSigningDateData.selectedDates[0].toDateString();
    if ($("#development-step-signing-date").val() != "")
        dealViewModel.contractSigningDate =
            developmentSigningDateData.selectedDates[0].toDateString();
    if ($("#hint-negotiating-step-signing-date").val() != "") dealViewModel.contractSigningDate = negotiateSigningDateData.selectedDates[0].toDateString();
    if ($("#hint-contest-step-signing-date").val() != "") dealViewModel.contractSigningDate = contestSigningDateData.selectedDates[0].toDateString();
    if ($("#hint-contract-signed-step-signing-date").val() != "") dealViewModel.contractSigningDate = contractSigningDateData.selectedDates[0].toDateString();

	dealViewModel.estimatedBudget = "0.00";
	if ($("#verification-step-estimated-budget").val() != "") dealViewModel.estimatedBudget = getNumberFromCurrency($("#verification-step-estimated-budget").val());
	if ($("#development-step-estimated-budget").val() != "") dealViewModel.estimatedBudget = getNumberFromCurrency($("#development-step-estimated-budget").val());
	if ($("#hint-negotiating-step-estimated-budget").val() != "") dealViewModel.estimatedBudget = getNumberFromCurrency($("#hint-negotiating-step-estimated-budget").val());
    if ($("#hint-contest-step-estimated-budget").val() != "") dealViewModel.estimatedBudget = getNumberFromCurrency($("#hint-contest-step-estimated-budget").val());

	dealViewModel.decisionMakerId = $("#verification-step-decision-maker").val();
	if ($("#development-step-decision-maker").val() != null) dealViewModel.decisionMakerId = $("#development-step-decision-maker").val();
	if ($("#hint-negotiating-step-decision-maker").val() != null) dealViewModel.decisionMakerId = $("#hint-negotiating-step-decision-maker").val();

    dealViewModel.contractClosureDate =
        developmentClosingDateData.selectedDates[0] === undefined ? "" : developmentClosingDateData.selectedDates[0].toDateString();
    if ($("#hint-negotiating-step-closing-date").val() != "") dealViewModel.contractClosureDate = negotiateClosingDateData.selectedDates[0].toDateString();
    if ($("#hint-contest-step-closing-date").val() != "") dealViewModel.contractClosureDate = contestClosingDateData.selectedDates[0].toDateString();
    if ($("#hint-contract-signed-step-closing-date").val() != "") dealViewModel.contractClosureDate = contractClosingDateData.selectedDates[0].toDateString();

    dealViewModel.procurementProcedureResultsDate = contestProcurementDateData.selectedDates[0] === undefined ? "" : contestProcurementDateData.selectedDates[0].toDateString();
	dealViewModel.selectionProcedureId = $("#verification-step-contest-procedure").val();
	if ($("#hint-contest-step-selection-procedure").val() != null) dealViewModel.selectionProcedureId = $("#hint-contest-step-selection-procedure").val();

	dealViewModel.purchaseTimeIntervalId = $("#verification-step-purchase-interval").val();

	dealViewModel.salesDepartmentsIds = [$("#verification-step-sales-departments").val()];
	if ($("#development-step-sales-departments").val() != null) dealViewModel.salesDepartmentsIds = [$("#development-step-sales-departments").val()];

	dealViewModel.industrialDepartmentsIds = [$("#verification-step-industrial-departments").val()];
	if ($("#development-step-industrial-departments").val() != null) dealViewModel.industrialDepartmentsIds = [$("#development-step-industrial-departments").val()];

	dealViewModel.productUnitsIds = [$("#verification-step-product-units").val()];
	if ($("#development-step-product-units").val().length != 0) dealViewModel.productUnitsIds = [$("#development-step-product-units").val()];

	dealViewModel.industrialUnitsIds = [$("#verification-step-industrial-units").val()];
	if ($("#development-step-industrial-units").val().length != 0) dealViewModel.industrialUnitsIds = [$("#development-step-industrial-units").val()];

	dealViewModel.salesUnitsIds = [null]
	dealViewModel.salesUnitsIds = [$("#verification-step-sales-units").val()];
	if ($("#development-step-sales-units").val() != null) dealViewModel.salesUnitsIds = [$("#development-step-sales-units").val()];

	dealViewModel.hintVerificationStepClientsTasksAndNeeds =
		$("#hint-verification-step-clients-tasks-and-needs").val();

    dealViewModel.isProbable = $(".current-step-content").find('.is-probable').val();

    if (dealViewModel.isProbable === undefined)
        dealViewModel.isProbable = 3;

	dealViewModel.estimatedMargin = "0.00";

	if ($("#development-step-estimated-margin").val() !== "") dealViewModel.estimatedMargin = getNumberFromCurrency($("#development-step-estimated-margin").val());
    if ($("#hint-negotiating-step-estimated-margin").val() !== "") dealViewModel.estimatedMargin = getNumberFromCurrency($("#hint-negotiating-step-estimated-margin").val());
    if ($("#hint-contest-step-estimated-margin").val() !== "") dealViewModel.estimatedMargin = getNumberFromCurrency($("#hint-contest-step-estimated-margin").val());
    if ($("#hint-contract-signed-step-estimated-margin").val() !== "") dealViewModel.estimatedMargin = getNumberFromCurrency($("#hint-contract-signed-step-estimated-margin").val());

	dealViewModel.estimatedRealMargin = "0.00";
	if ($("#hint-negotiating-step-expert-margin").val() !== "") dealViewModel.estimatedRealMargin = getNumberFromCurrency($("#hint-negotiating-step-expert-margin").val());
	if ($("#hint-contest-step-expert-margin").val() !== "") dealViewModel.estimatedRealMargin = getNumberFromCurrency($("#hint-contest-step-expert-margin").val());
    if ($("#hint-contract-signed-step-expert-margin").val() !== "") dealViewModel.estimatedRealMargin = getNumberFromCurrency($("#hint-contract-signed-step-expert-margin").val());
    if ($("#hint-contract-works-step-expert-margin").val() !== "") dealViewModel.estimatedRealMargin = getNumberFromCurrency($("#hint-contract-works-step-expert-margin").val());

    dealViewModel.hintContractSignedStepDealAmount = getNumberFromCurrency($("#hint-contract-signed-step-deal-amount").val());

    dealViewModel.hintDevelopmentStepDefineWorkGroup =
		$("#hint-development-step-define-work-group").prop("checked");
	dealViewModel.hintDevelopmentStepDefineVendors = $("#hint-development-step-define-vendors").prop("checked");
	dealViewModel.hintDevelopmentStepFillInProductionClaim =
		$("#hint-development-step-fill-in-production-claim").prop("checked");
	dealViewModel.hintDevelopmentStepRegisterProjectWithVendor =
		$("#hint-development-step-register-project-with-vendor").prop("checked");
	dealViewModel.hintDevelopmentStepWorkThroughSpecialPricesMechanism =
		$("#hint-development-step-work-through-defense-mechanisms").prop("checked");
	dealViewModel.hintDevelopmentStepRequestSpecialPricesFromVendor =
		$("#hint-development-step-get-special-prices-from-vendor").prop("checked");
	dealViewModel.hintDevelopmentStepDevelopTKP = $("#hint-development-step-work-through-tz").prop("checked");
	dealViewModel.hintDevelopmentStepLayoutProject = $("#hint-development-step-layout-updating").prop("checked");


	// step 3
	dealViewModel.hintNegotiatingStepMeetingWithCustomer =
		$("#hint-negotiating-step-meeting-with-customer").prop("checked");
	dealViewModel.hintNegotiatingStepApproveSpecificationWithCustomer =
		$("#hint-negotiating-step-approve-specification-with-customer").prop("checked");
	dealViewModel.hintNegotiatingStepApproveSolutionArchitectureWithCustomer =
		$("#hint-negotiating-step-approve-solution-architecture-with-customer").prop("checked");
	dealViewModel.hintNegotiatingStepWorkThroughObjections =
		$("#hint-negotiating-step-work-through-objections").prop("checked");
	dealViewModel.hintNegotiatingStepGetSpecialPricesFromVendor =
        $("#hint-negotiating-step-get-special-price-from-vendor").prop("checked");
	dealViewModel.hintNegotiatingStepLayoutUpdating =
	    $("#hint-negotiating-step-layout-updating").prop("checked");
	dealViewModel.hintNegotiatingStepWorkThroughDefenseMechanisms =
        $("#hint-negotiating-step-work-out-defense-mechanisms").prop("checked");
	dealViewModel.hintNegotiatingStepWorkThroughTZ = $("#hint-negotiating-step-work-out-tz").prop("checked");

    //step4
	dealViewModel.hintContestStepGetContestDocs = $("#hint-contest-step-get-contest-docs").prop("checked");
	dealViewModel.hintContestStepNotifyHostTeam = $("#hint-contest-step-notify-host-team").prop("checked");
	dealViewModel.hintContestStepNotifyVendorsTeam = $("#hint-contest-step-notify-vendors-team").prop("checked");
	dealViewModel.hintContestStepGetSpecialPrices = $("#hint-contest-step-get-special-prices").prop("checked");
	dealViewModel.hintContestStepSupplyConditions = $("#hint-contest-step-supply-conditions").prop("checked");
	dealViewModel.hintContestStepCompetitorsOffersWorkedThrough =
		$("#hint-contest-step-competitors-offers-worked-through").prop("checked");
	dealViewModel.hintContestStepLayoutWithRisks = $("#hint-contest-step-layout-with-risks").prop("checked");
	dealViewModel.hintContestStepContestClaim = $("#hint-contest-step-contest-claim").prop("checked");

    dealViewModel.procurementProcedureResultsDate = contestProcurementDateData.selectedDates[0] === undefined ? "" : contestProcurementDateData.selectedDates[0].toDateString();

	//5
	dealViewModel.hintContractSignedStepApproveProjectWithVendor =
		$("#hint-contract-signed-step-approve-project-with-vendor").prop("checked");
	dealViewModel.hintContractSignedStepCheckSigningProcedureFormat =
		$("#hint-contract-signed-step-check-signing-procedure-format").prop("checked");
	dealViewModel.hintContractSignedStepGetAndPassProvision =
		$("#hint-contract-signed-step-get-and-pass-provision").prop("checked");
	dealViewModel.hintContractSignedStepPassClaimForService =
		$("#hint-contract-signed-step-pass-claim-for-service").prop("checked");
	dealViewModel.hintContractSignedStepUpdateDataInSystems =
		$("#hint-contract-signed-step-update-data-in-systems").prop("checked");
	dealViewModel.hintContractSignedStepFormatSaleIn1C =
		$("#hint-contract-signed-step-format-sale-in-1c").prop("checked");

	//6

	dealViewModel.hintContractWorksStepSupplyMonitoring =
		$("#hint-contract-works-step-supply-monitoring").prop("checked");
	dealViewModel.hintContractWorksStepPaymentControl =
		$("#hint-contract-works-step-payment-control").prop("checked");
	dealViewModel.hintContractWorksStepPassDocsToAccounting =
		$("#hint-contract-works-step-pass-docs-to-accounting").prop("checked");
	dealViewModel.hintContractWorksStepInternalProjectReference =
		$("#hint-contract-works-step-internal-project-reference").prop("checked");
	dealViewModel.hintContractWorksStepDiscussProject =
        $("#hint-contract-works-step-discuss-project").prop("checked");

	//files
	dealViewModel.fileLayout = $('#development-file-layout')[0].innerText;
	dealViewModel.fileProposal = $('#negotiating-file-updated-commercial-proposal')[0].innerText;
	dealViewModel.fileUpdatedLayout = $('#negotiating-file-updated-layout')[0].innerText;
	dealViewModel.fileTz = $('#contest-file-tz')[0].innerText;
    dealViewModel.fileTkp = $('#contest-file-tkp')[0].innerText;
    dealViewModel.fileContestDocumentation = $('label[for="contest-file-contest-documentation"]')
        .attr('data-file-count');
    dealViewModel.fileProjectContest = $('#contest-file-contract-project')[0].innerText;
	dealViewModel.fileContractScan = $('#signed-file-contract-scan')[0].innerText; 
    dealViewModel.fileBasisForServiceRequest = $('#basis-for-service-request')[0].innerText;
    dealViewModel.fileActsScans = $('#works-file-acts-scans')[0].innerText;

    //fileLinks
    dealViewModel.fileLinks = getAllCloudLinks();

	return dealViewModel;
}

// Тип сделки задается на 1 или 2 этапе. Если текущий этап 1 или 2, то значение берется с поля на нем.
// Т.к. если мы на 1, то значение надо взять именно с него, т.к. на 2 оно null. Если мы на 2, 
// то значение тоже надо взять именно с него, т.к. на 2 этапе юзер мог сменить значение.
// Если на текущем этапе нет этого поля, берем его значение с 1 этапа.
// Справедливо и для других аналогичных конструкций заполнения полей.
// todo: проверить корректность механизма при сохранении сделок на разных этапах
// todo: можно выделить заполнение такого типа в функцию, а то некрасиво.

function getMultiStepElementValue(elementSpecificQuery, isCheckbox = false) {
	const element = $(`#steps-card-body .tab-content .tab-pane.current-step-content ${elementSpecificQuery}`);
	if (isCheckbox)
		return element.length ? element.prop("checked")
			: $(`#steps-card-body .tab-content .tab-pane ${elementSpecificQuery}`).first().prop("checked");

	return element.length ? element.val()
		: $(`#steps-card-body .tab-content .tab-pane ${elementSpecificQuery}`).first().val();
}

function clearRequiredFields() {
	$(`.tab-pane.current-step-content input[required],
                .tab-pane.current-step-content select[required],
					.tab-pane.current-step-content textarea[required]`).each(function () {
		const element = $(this);
		if (getRequiredElementParentBlock(element)[0].classList.contains("required-field-group-highlighted"))
			getRequiredElementParentBlock(element)[0].classList.remove("required-field-group-highlighted");
	});

    formIsValid = true;
    firstStepIsValid = true;
}

function checkFieldsForFirstStep() {
	let name = $('#verification-step-name');
	let organization = $('#verification-step-organization');
    let contact = $('#verification-step-contact');
    let responsible = $('#verification-step-responsible');

    name.val(name.val().replace(/^\s+|\s+$/g, ''));

    if (name.val() === "") {
        highlightRequiredElementBlock(name);
        firstStepIsValid = false;
    }

    if (organization.val() === null || (Array.isArray(organization.val()) && !organization.val().length)) {
        highlightRequiredElementBlock(organization);
        firstStepIsValid = false;
    }

    if (responsible.val() === null || (Array.isArray(responsible.val()) && !responsible.val().length)) {
        highlightRequiredElementBlock(responsible);
        firstStepIsValid = false;
    }

    if (contact.val() === null || (Array.isArray(contact.val()) && !contact.val().length)) {
        highlightRequiredElementBlock(contact);
        firstStepIsValid = false;
    }

}

function checkRequiredFields() {
	$(`.tab-pane.current-step-content input[required],
                .tab-pane.current-step-content select[required],
					.tab-pane.current-step-content textarea[required]`).each(function () {

		const element = $(this);

		switch (element.prop("tagName")) {
			case "INPUT":
				if (element.prop("type") === "checkbox") {
					if (!element.prop("checked"))
						highlightRequiredElementBlock(element);

				} else {
                    if (element.prop("type") === "button") {
                        if (element[0].form.innerText === "") {
                            var fileCount = $('label[for="' + element[0].form.id + '"]')
                                .attr('data-file-count');

                            var cloudLinkName = element[0].form.id + "-cloud";

                            if (window.cloudLinks.has(cloudLinkName) || (fileCount !== undefined && +fileCount > 0))
                                return true;

                            highlightRequiredElementBlock(element);
                        }
                    } else {
                        element.val(element.val().trim());
                        if (element.val() === "" || element.val() === "0,00 ₽")
                            highlightRequiredElementBlock(element);
                    }
                }
				break;

			case "SELECT":
				if (element.val() === null || (Array.isArray(element.val()) && !element.val().length)) {
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


function GetRequiredFieldsForDVS() {
	let requiredCheckBoxes = ["hint-contract-works-step-payment-control", "hint-contract-works-step-pass-docs-to-accounting"];
	let requiredFiles = ["signed-file-contract-project-with-attachments", "signed-file-contract-scan", "works-file-acts-scans"];
	$(`.tab-pane.current-step-content input[required]`).each(function () {
		const element = $(this);

		if (element.prop("type") === "checkbox") {
			if (requiredCheckBoxes.indexOf(element[0].attributes[0].value) == -1) {
				getRequiredElementParentBlock(element)[0].classList.remove("required");
				element.prop('required', false);
			}
		} else
			if (element.prop("type") === "button") {
				if (requiredFiles.indexOf(getRequiredElementParentBlock(element)[0].firstElementChild.htmlFor) == -1) {
					getRequiredElementParentBlock(element)[0].classList.remove("required");
					element.prop('required', false);
				}
			}
	});

	formIsValid = true;
}

function GetRequiredFieldsForDISAndDPS() {
	let requiredCheckBoxes = ["hint-development-step-define-work-group", "hint-development-step-define-vendors", "hint-development-step-register-project-with-vendor", "hint-development-step-work-through-tz", "hint-development-step-layout-updating",
		"hint-negotiating-step-meeting-with-customer", "hint-negotiating-step-approve-specification-with-customer", "hint-negotiating-step-approve-solution-architecture-with-customer", "hint-negotiating-step-layout-updating"];

	let requiredFiles = ["development-file-layout",
		"negotiating-file-updated-commercial-proposal", "negotiating-file-updated-layout"];
	$(`.tab-pane.current-step-content input`).each(function () {
		const element = $(this);

		if (element.prop("type") === "checkbox") {
			if (requiredCheckBoxes.indexOf(element[0].attributes[0].value) != -1)
				if (!element.closest("div.form-group")[0].classList.contains("required")) {
					element.closest("div.form-group")[0].classList.add("required");
					element.prop('required', true);
				}
		} else
			if (element.prop("type") === "button")
				if (element.closest("div.form-group").length != 0)
					if (requiredFiles.indexOf(element.closest("div.form-group")[0].firstElementChild.htmlFor) != -1)
						if (!element.closest("div.form-group")[0].classList.contains("required")) {
							element.closest("div.form-group")[0].classList.add("required");
							element.prop('required', true);
						}
	});

	formIsValid = true;
}


function highlightRequiredElementBlock(element) {
	formIsValid = false;
	getRequiredElementParentBlock(element).addClass("required-field-group-highlighted");
}

function getRequiredElementParentBlock(element) {
	return element.closest("div.form-group.required");
}

function getNumberFromCurrency(value) {
	return Number(value.replace(/[^0-9,.\-]+/g, "").replace(",", ".").replace("₽", "").replace(" ", ""));
}