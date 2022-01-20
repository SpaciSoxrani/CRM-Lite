var interestData;
var id;

$(document).ready(function () {

    id = location.href.split('/')[location.href.split('/').length - 1];

    if (id === "Interest") id = "";
    else {
        $.ajax({
            type: "GET",
            contentType: "application/json",
            url: `${api}/api/SalesInterest/${id}/${user.id}`,
            success: function (data) {
                interestData = data;
                if (data.step === 1) {
                    FillStep($('#interest-creating-tab'));
                    Block(2);
                    $('#interest-creating-tab').click();
                }
                else {
                    FillStep($('#interest-qualification-tab'));
                    Block(1);
                    $('#interest-qualification-tab').click();
                }
                FillFields();
                console.log("Ураа!");
            },
            error: function (xhr) {
                console.log("Ошибка при формировании перечня маркетинговых списков!");
                console.log(xhr);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    }
    $('card a').on('click', function (e) {
        e.preventDefault();
    });

    if (id === "") {
        $('#interest-creating-tab').click();
        //$('#contact').prop('disabled', 'disabled');
        Block(2);
        FillFields();
    }


});

var Block = (stepNumber) => {
    if (stepNumber === 1) {
        $('#createInterest :input').prop('disabled', 'disabled');
    }
    else
        $('#qualificateInterest :input').prop('disabled', 'disabled');
};

var FillStep = (e) => {
    var interestStep = $(e).attr('id');

    if (interestStep === "interest-creating-tab") {
        $('#qualificateInterest').hide();
        $('#createInterest').show();
    }
    else {
        $('#createInterest').hide();
        $('#qualificateInterest').show();
    }
};

var FillContactInfo = () => {
    var contactId = $('#contact').val();

    if (contactId === null) {
        $('#job-title').val(null);
        $('#work-phone').val(null);
        $('#mobile-phone').val(null);
        $('#mail').val(null);
        $('#job-title, #work-phone, #mobile-phone, #mail').prop('disabled', 'disabled');
        return;
    }

    $.ajax({
        url: `${location.origin}/Contacts/GetContact/${contactId}`,
        success: function (data) {
            $('#job-title').val(data.jobTitle);
            $('#work-phone').val(data.workPhone);
            $('#mobile-phone').val(data.mobilePhone);
            $('#mail').val(data.email);
            $('#job-title, #work-phone, #mobile-phone, #mail').prop('disabled', false);
        },
        xhrFields: {
            withCredentials: true
        }
    });
};

var FillOrganizationInfoAndLoadContact = () => {
    var organizationId = $('#organization').val();

    if (organizationId === null) {
        $('#contact').prop('disabled', 'disabled');
        return;
    }

    $.ajax({
        url: `${location.origin}/Organizations/GetOrganizationById/${organizationId}`,
        success: function (data) {
            $('#web-site').val(data.site);
            $('#address').val(data.address);
            $('#industry').val(data.industryId);
            $('#industry').trigger('change');
            $('#web-site, #address, #industry').prop('disabled', false);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/Contacts/ContactsFromOrganizationForInterest/${organizationId}`,
        success: function (data) {
            var contact = $('#contact');
            var jobtitle = $('#job-title');
            var workphone = $('#work-phone');
            var mobilephone = $('#mobile-phone');
            var mail = $('#mail');

            $('#contact, #job-title, #work-phone, #mobile-phone, #mail').find('option').remove();

            $.each(data, function (idx, a) {
                contact.append(new Option(a.displayName, a.id));
                jobtitle.append(new Option(a.jobTitle, a.id));
                workphone.append(new Option(a.workPhone, a.id));
                mobilephone.append(new Option(a.mobilePhone, a.id));
                mail.append(new Option(a.email, a.id));
            });
            
            $('#contact, #job-title, #work-phone, #mobile-phone, #mail').val(null);
            
        },
        xhrFields: {
            withCredentials: true
        }
    });

    if (interestData === undefined ||
            interestData !== undefined && interestData.step !== 2)
        $('#contact').prop('disabled', false);
};

var FillFields = () => {

    if (interestData !== undefined) {

        if (interestData.organizationId !== null) {
            $.ajax({
                type: "GET",
                url: `${location.origin}/Contacts/ContactsFromOrganization/${interestData.organizationId}`,
                success: function (data) {
                    var mainContact = $('#main-contact');
                    $.each(data, function (idx, a) {
                        mainContact.append(new Option(a.displayName, a.displayName));
                    });
                    if (interestData === undefined) {
                        mainContact.val(null);
                    } else if (interestData.mainContactString !== null) {
                        mainContact.val(interestData.mainContactString);
                        mainContact.trigger('change');
                    }
                },
                error: function (data) {
                    alert(data);
                },
                dataType: 'JSON',
                xhrFields: {
                    withCredentials: true
                }
            });
        }

        $('#address').val(interestData.address);
        $('#web-site').val(interestData.webSite);

        $('#job-title').val(interestData.jobTitle);
        $('#mail').val(interestData.email);
        $('#work-phone').val(interestData.workPhone);
        $('#mobile-phone').val(interestData.mobilePhone);

        $('#theme').val(interestData.theme);
        $('#description').val(interestData.description);
        $("#is-marketing-materials").prop('checked', interestData.isMarketingMaterialsIncluded);
        if (interestData.lastCompanyDate !== null)
            $('#calendar').val(interestData.lastCompanyDate.substring(0, 10));

        if (interestData.step === 1 && interestData.organizationId !== "" && 
                interestData.organizationId !== null)
            $('#contact').prop('disabled', false);

        $('#estimated-budget').val(interestData.planBudget);
        Auto($('#estimated-budget'));
        $('#client-tasks').val(interestData.clientsTasks);

        $('#description, #is-marketing-materials, #calendar, #estimated-budget, #client-tasks').trigger('change');
    }

    $.ajax({
        url: `${api}/api/industries`,
        success: function (data) {
            var ind = $('#industry');
            $.each(data, function (idx, a) {
                ind.append(new Option(a.name, a.id));
            });
            if (interestData === undefined) 
                $("#industry").val(null);
            else {
                $("#industry").val(interestData.industryId);
                $('#industry').trigger('change');
            }
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Interests`,
        success: function (data) {
            var interest = $('#interest');
            $.each(data, function (idx, a) {
                interest.append(new Option(a.name, a.id));
            });
            if (interestData === undefined) {
                interest.val(null);
            } else {
                interest.val(interestData.interestId);
                interest.trigger('change');
            }
        },
        xhrFields: {
            withCredentials: true
        }
    });

    if (interestData !== undefined && interestData.organizationId !== "") {

        $.ajax({
            url: `${location.origin}/Contacts/Short`,
            success: function (data) {
                var mail = $('#mail');
                $.each(data, function (idx, a) {
                    contact.append(new Option(a.displayName, a.id));
                });
                $('#contact').val(null);
                if (interestData.contactId !== "" && interestData.contactId !== null)
                    $('#contact').val(interestData.contactId);
                if (interestData.step === 1 && interestData.contactId !== null)
                    $('#job-title, #work-phone, #mobile-phone, #mail').prop('disabled', false);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    }

    $.ajax({
        url: `${location.origin}/Organizations/GetOrganizations`,
        success: function (data) {
            var organization = $('#organization');
            $.each(data, function (idx, a) {
                organization.append(new Option(a.shortName, a.id));
            });
            if (interestData === undefined) {
                $('#organization').val(null);
                return;
            } 
            if (interestData.organizationId !== "" && interestData.organizationId !== null)
                $('#organization').val(interestData.organizationId);
            
            if (interestData.step === 1 && interestData.organizationId !== null)
                $('#web-site, #address, #industry').prop('disabled', false);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${location.origin}/api/ProductLines`,
        success: function (data) {
            var product = $('#product');
            $.each(data, function (idx, a) {
                product.append(new Option(a.name, a.id));
            });
            if (interestData === undefined) {
                product.val(null);
            } else {
                product.val(interestData.productLineId);
                product.trigger('change');
            }
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/GetRealizationPlans`,
        success: function (data) {
            var plans = $('#plans');
            $.each(data, function (idx, a) {
                plans.append(new Option(a.name, a.id));
            });
            if (interestData === undefined) {
                plans.val(null);
            } else {
                plans.val(interestData.realisationPlanId);
                plans.trigger('change');
            }
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        type: "GET",
        url: `${api}/api/GetInterestQualification`,
        success: function (data) {
            var qualification = $('#interest-qualification');
            $.each(data, function (idx, a) {
                qualification.append(new Option(a.name, a.id));
            });
            if (interestData === undefined) {
                qualification.val(null);
            } else {
                qualification.val(interestData.interestQualificationId);
                qualification.trigger('change');
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        type: "GET",
        url: `${location.origin}/api/MarketingCompany`,
        success: function (data) {
            var source = $('#source-campaign');
            $.each(data, function (idx, a) {
                source.append(new Option(a.name, a.name));
            });
            if (interestData === undefined) {
                source.val(null);
            } else {
                source.append(new Option(interestData.marketingCompanySource,
                    interestData.marketingCompanySource));
                source.val(interestData.marketingCompanySource);
                source.trigger('change');
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/users/getSalesUsers`,
        success: function (data) {
            var responsible = $('#responsible');
            $.each(data, function (idx, a) {
                responsible.append(new Option(a.displayName, a.id));
            });
            if (interestData === undefined) {
                responsible.val(null);
            } else {
                responsible.val(interestData.responsibleId);
                responsible.trigger('change');
            }
        },
        xhrFields: {
            withCredentials: true
        }
    });
};