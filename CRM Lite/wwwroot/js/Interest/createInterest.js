/// <reference path="interest.js" />
var GetFields = (interestModel) => {

    var id = location.href.split('/')[location.href.split('/').length - 1];
    if (id !== "Interest")
        interestModel.id = id;
    interestModel.Interest = $('#interest').val();
    interestModel.userId = user.id;

    interestModel.Contact = $('#contact').val();
    interestModel.JobTitle = $('#job-title').val();
    interestModel.WorkPhone = $('#work-phone').val();
    interestModel.MobilePhone = $('#mobile-phone').val();
    interestModel.Email = $('#mail').val();

    interestModel.Organization = $("#organization").val();
    interestModel.WebSite = $("#web-site").val();
    interestModel.Address = $("#address").val();
    interestModel.IndustryId = $("#industry").val();

    interestModel.IsMarketingMaterial = $("#is-marketing-materials").prop("checked");
    interestModel.SourceCampaign = $("#source-campaign").val();
    interestModel.Responsible = $("#responsible").val();
    interestModel.Theme = $("#theme").val();
    interestModel.Description = $("#description").val();
    interestModel.LastCompanyDate = $("#calendar").val();

    if ($("#estimated-budget").val() !== undefined)
        interestModel.PlanBudget = getNumberFromCurrency($("#estimated-budget").val());
    interestModel.InterestQualificationId = $("#interest-qualification").val();
    interestModel.MainContactString = $("#main-contact").val();
    interestModel.ClientsTasks = $("#client-tasks").val();
    interestModel.RealisationPlanId = $("#plans").val();
    interestModel.ProductLineId = $("#product").val();

    return interestModel;
};

var SaveInterest = () => {
    let isValid = checkFields();

    if (!isValid)
        return;

    let interestModel = {};
    interestModel.IsReadyToMergeToDeal = false;
    interestModel = GetFields(interestModel);

    if (interestModel.InterestQualificationId !== "" &&
        interestModel.MainContactString !== "" &&
        interestModel.ClientsTasks !== "" &&
        interestModel.RealisationPlanId !== "" &&
        interestModel.ProductLineId !== "" &&
        $("#interest-qualification :selected").text() === "Тёплый")
            interestModel.IsReadyToMergeToDeal = true;

    $.ajax({
        type: "POST",
        url: `${api}/api/PostSalesInterest`,
        data: JSON.stringify(interestModel),
        contentType: "application/json",
        success: function (data) {
            if (interestModel.IsReadyToMergeToDeal)
                window.location.href = `/Deals/Deal/${data.id}`;
            else
                window.location.href = `/Interest/Interest/${data.id}`;
            console.log(data);
            console.log("SalesInterest Saved");
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
                return;
            }
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
};

var MergeToDeal = (interestModel) => {
    interestModel.id = "";
    interestModel.createdDate = "";
    interestModel.changedDate = "";

    interestModel.isRecurring = false;

    interestModel.stepId = "";
    interestModel.probability = "10%";
    interestModel.isProbable = false;
    interestModel.name = "";

    interestModel.shortName = $("#theme").val();
    interestModel.contactId = $("#contact").val();
    interestModel.organizationId = $("#organization").val();
    interestModel.responsibleUserId = $("#responsible").val();
    interestModel.isMergedFromInterest = true;

    interestModel.salesDepartmentsIds = [null];
    interestModel.industrialDepartmentsIds = [null];
    interestModel.productUnitsIds = [null];
    interestModel.industrialUnitsIds = [null];
    interestModel.salesUnitsIds = [null];
    interestModel.productLine = [];
    interestModel.peopleOfInterest = [];

    $.ajax({
        type: "POST",
        url: `${api}/api/Deal`,
        data: JSON.stringify(interestModel),
        contentType: "application/json",
        success: function (data) {

            console.log(data);
            window.location.href = `/Deals/Deal/${data.id}`;
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
};

var checkFields = () => {

    let isValid = true;

    $(`.additionalInfo input[required], 
        .additionalInfo select[required],
        .additionalInfo textarea[required]`).each(function() {

        const element = $(this);

        switch (element.prop("tagName")) {
        case "TEXTAREA":
        case "INPUT":
            if (element.prop("type") === "checkbox") {
                if (!element.prop("checked")) {
                    highlightRequiredElementBlock(element);
                    isValid = false;
                }
            } else {
                if (element.val() === "") {
                    highlightRequiredElementBlock(element);
                    isValid = false;
                }
            }
            break;

        case "SELECT":
            if (element.val() === null || Array.isArray(element.val()) && !element.val().length) {
                highlightRequiredElementBlock(element);
                isValid = false;
            }
            break;
        }
    });
    return isValid;
};

var highlightRequiredElementBlock = (element) => {
    getRequiredElementParentBlock(element).addClass("required-field-group-highlighted");
};

var getRequiredElementParentBlock = (element) => {
    return element.closest("div.form-group");
};

var getNumberFromCurrency = (value) => {
    return Number(value.replace(/[^0-9,.]+/g, "").replace(",", ".").replace("₽", "").replace(" ", ""));
};