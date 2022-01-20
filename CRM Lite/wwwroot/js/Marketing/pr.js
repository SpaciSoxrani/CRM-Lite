var FillAdditionalFields = () => {

    $.ajax({
        url: `${location.origin}/api/MarketingPrTags`,
        success: function (data) {
            let ind = $('#heading');
            $.each(data, function (idx, a) {
                ind.append(new Option(a.name, a.id));
            });
            $("#heading").val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/api/MarketingPrType`,
        success: function (data) {
            let ind = $('#pr-type');
            $.each(data, function (idx, a) {
                ind.append(new Option(a.name, a.id));
            });
            $("#pr-type").val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });
}

var saveCompany = () => {
    let isValid = checkGeneralFields() & checkAdditionalFields();

    if (!isValid)
        return;

    let companyModel = GetMarketingCompanyFields();
    companyModel.prCompanyDto = GetPrCompanyFields();

    $.ajax({
        type: "POST",
        url: `${location.origin}/api/MarketingCompany/PrCompany`,
        data: JSON.stringify(companyModel),
        contentType: "application/json",
        success: function(data) {

            console.log(data);
            console.log("PrCompany Saved");
            //GetDealName(dealViewModel, data)
        },
        error: function(data) {
            alert(data);
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
};

var checkAdditionalFields = () => {

    let isValid = true;

    $(`.additionalInfo input[required], 
        .additionalInfo select[required],
        .additionalInfo textarea[required]`).each(function () {

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
                if (element.val() === null || (Array.isArray(element.val()) && !element.val().length)) {
                    highlightRequiredElementBlock(element);
                    isValid = false;
                }
                break;
            }
        });
    return isValid;
}

var highlightRequiredElementBlock = (element) => {
    getRequiredElementParentBlock(element).addClass("required-field-group-highlighted");
};

var getRequiredElementParentBlock = (element) => {
    return element.closest("div.form-group");
};

var GetPrCompanyFields = () => {
    let companyModel = {};

    companyModel.id = null;
    companyModel.prTypeId = $("#pr-type").val();
    companyModel.PrTagId = $("#heading").val();
    companyModel.Header = $("#header").val();
    companyModel.IsPublication = $("#is-publication").prop("checked");
    companyModel.Body = $("#content").val();
    companyModel.Comments = $("#comments").val();
    companyModel.AudienceCoveragePlan = $("#planned-audience-сoverage").val();
    companyModel.AudienceCoverageFact = $("#fact-audience-сoverage").val();
    companyModel.MarketingListId = $("#marketing-lists").val();

    return companyModel;
};
