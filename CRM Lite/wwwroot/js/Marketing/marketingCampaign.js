$(document).ready(function () {
	//FillFields();
	var id = location.href.split('/')[location.href.split('/').length - 1];
	if (id === "Organization") id = "";

	FillFields();
});

const jsFileLoadingMap = new Map([
    ['PR', '../js//Marketing/pr.js'],
    ['E-Mail', '../js//Marketing/email.js'],
    ['Loyalty', '../js//Marketing/loyalty.js'],
    ['Event', '../js//Marketing/event.js'],
    ['Internet-marketing', '../js//Marketing/net.js']
]);

var FillFields = () => {
    $.ajax({
        url: `${location.origin}/api/Industries`,
        success: function (data) {
            let ind = $('#industry');
            $.each(data, function (idx, a) {
                ind.append(new Option(a.name, a.id));
            });
            $("#industry").val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/api/Users/Marketing`,
        success: function (data) {
            let responsible = $('#responsible');
            $.each(data, function (idx, a) {
                responsible.append(new Option(a.displayName, a.id));
            });
            responsible.val(user.id);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/api/ContactRoles`,
        success: function (data) {
            let audience = $('#audience');
            $.each(data, function (idx, a) {
                audience.append(new Option(a.name, a.id));
            });
            audience.val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/api/ProductLines`,
        success: function (data) {
            var solution = $('#solutions')
            $.each(data, function (idx, a) {
                solution.append(new Option(a.name, a.id));
            });
            solution.val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        type: "GET",
        url: `${location.origin}/api/CompanyTypes`,
        success: function (data) {
            var type = $('#type');
            $.each(data, function (idx, a) {
                type.append(new Option(a.name, a.id));
            });
            type.val(null);
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

var FillEvent = () => {
    var url = location.origin + "/Campaigns/ReturnCompanyPartialView";
    var companyType = $('#type').select2('data')[0].text;

    $('#appointedCompany').load(url, { companyType: companyType }, function () {

        $("select").select2({
            placeholder: "Выберите элемент",
            allowClear: true
        });

        let script = document.createElement('script');

        script.src = jsFileLoadingMap.get(companyType);
        document.head.append(script);

        script.onload = function () {
            FillAdditionalFields();
        };
    });
};

var checkGeneralFields = () => {

    let isValid = true;

    $(`.generalInfo input[required], 
        .generalInfo select[required]`).each(function () {

            const element = $(this);

            switch (element.prop("tagName")) {
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
};

var highlightRequiredElementBlock = (element) => {
    getRequiredElementParentBlock(element).addClass("required-field-group-highlighted");
};

var getRequiredElementParentBlock = (element) => {
    return element.closest("div.form-group");
};

var GetMarketingCompanyFields = () => {
    let companyModel = {};

    companyModel.id = null;
    companyModel.Name = $('#company-name').val();
    companyModel.Place = $('#geography').val();
    companyModel.IndustryId = $('#industry').val();
    companyModel.PlanBudget = getNumberFromCurrency($('#planned-budget').val());
    companyModel.FactBudget = getNumberFromCurrency($('#actual-budget').val());
    companyModel.AudienceId = $('#audience').val();
    companyModel.ResponsibleUserId = $('#responsible').val();
    companyModel.Partners = $('#partners').val();
    companyModel.ProductLineIds = [$('#solutions').val()];
    companyModel.StartActivityDateTime = $('#first-date-created').val();
    companyModel.EndActivityDateTime = $('#last-date-created').val();

    return companyModel;
}

var getNumberFromCurrency = (value) => {
    return Number(value.replace(/[^0-9,.]+/g, "").replace(",", ".").replace("₽", "").replace(" ", ""));
}