var users;
var vendors;

$(function () {
    document.querySelector("body").classList.add("sidebar-hidden");

    LoadRequestInfo().catch((err) => {
        console.error(err);
    });
});

async function LoadRequestInfo() {
    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            $.each(data, function (idx, a) {
                $("#new-responsible-product").append(new Option(a.displayName, a.id));
            });

            $("#new-responsible-product").trigger('change');
        }
    });

    $.ajax({
        url: `${api}/api/ProductRequests/AccessToAddMp`,
        success: function (data) {
            if (data) {
                $("#responsible-pm").prop("disabled", false);
                $("#comment").prop("disabled", false);
            } else {
                $('#show-pm-button').addClass('d-none');
            }
        }
    });

    await GetAdmAndTechContacts().catch((err) => {
        console.error(err);
    });

    await GetAnotherResponsiblePeoples().catch((err) => {
        console.error(err);
    });

    await GetVendorsAndResponsibles().catch((err) => {
        console.error(err);
    });

    $("#repeat-deal").prop("checked", window.productRequest.isRepeatStatement);
}

async function GetAdmAndTechContacts() {
    $("#tech-contact").empty();
    $("#adm-contact").empty();

    var opt = {
        "Контакты из организации": [],
        "Другие контакты": []
    };

    $.ajax({
        url: `${location.origin}/Contacts/Short`,
        success: function (data) {

            $.each(data, function (idx, a) {
                if (a.organizationId === window.productRequest.deal.organizationId) {
                    opt["Контакты из организации"].push(new Option(a.displayName, a.id));
                } else
                    opt["Другие контакты"].push(new Option(a.displayName, a.id));
            });

            window.EnableSearchingAnotherContacts([
                $("#adm-contact"), $("#tech-contact")
            ], opt);

            $("#adm-contact").val(window.productRequest.admContactId).trigger("change");
            $("#tech-contact").val(window.productRequest.techContactId).trigger("change");
        }
    });
}

async function GetAnotherResponsiblePeoples() {
    $("#another-responsible").empty();
    $("#add-pm").empty();
    $("#responsible-pm").empty();

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            $.each(data, function (idx, a) {
                $("#another-responsible").append(new Option(a.displayName, a.id));
                $("#add-pm").append(new Option(a.displayName, a.id));
                $("#responsible-pm").append(new Option(a.displayName, a.id));
            });

            let peoples = window.productRequest.anotherResponsiblesProductRequest.map(resp => resp.responsibleUserId);
            
            $("#another-responsible").val(peoples).trigger("change");
            $("#add-pm").val(null).trigger("change");
            $("#responsible-pm").val(window.productRequest.deal.pmId).trigger("change");

            $("#responsible-pm, #comment").on('change',
                function () {
                    $('#save-new-pm').removeClass('d-none');
                });
        }
    });
}

async function GetVendorsAndResponsibles() {
    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            users = data;

            if (window.productRequest.vendorsRequests.length === 0) {
                $.each(data,
                    function(idx, a) {
                        $("#responsible-product0").append(new Option(a.displayName, a.id));
                    });

                $("#responsible-product0").val(null);

                $("#responsible-product0").trigger('change');
            } else {
                for (var i = 0; i < window.productRequest.vendorsRequests.length; i++) {
                    $.each(data,
                        function(idx, a) {
                            $("#responsible-product" + i).append(new Option(a.displayName, a.id));
                        });

                    if (window.productRequest.vendorsRequests[i].comment)
                        $("#comment" + i).val(window.productRequest.vendorsRequests[i].comment);

                    $("#responsible-product" + i).val(window.productRequest.vendorsRequests[i].responsibleId);

                    $("#responsible-product" + i).trigger('change');
                }
            }
        },
        error: function (data) {
            console.error(data);
        }
    });

    $.ajax({
        url: `${api}/api/Vendors/Deal/${window.productRequest.dealId}`,
        success: function (data) {
            vendors = data;

            if (window.productRequest.vendorsRequests.length === 0) {
                $.each(data,
                    function(idx, a) {
                        $("#vendor0").append(new Option(a.name, a.id));
                    });

                $("#vendor0").val(null);

                $("#vendor0").on('change', function () {
                    window.fillResponsiblePeoples('0');
                });
            } else {
                for (var i = 0; i < window.productRequest.vendorsRequests.length; i++) {
                    $.each(data,
                        function(idx, a) {
                            if (a.id === window.productRequest.vendorsRequests[i].vendorId)
                                $("#vendor" + i).append(new Option(a.name, a.id, true, true));
                            else
                                $("#vendor" + i).append(new Option(a.name, a.id));
                        });

                    if (window.productRequest.vendorsRequests[i].vendorId === null)
                        $("#vendor" + i).val(null);

                    $("#vendor" + i).on('change',
                        function() {
                            window.fillResponsiblePeoples(`${i}`);
                    });
                }
            }
        },
        error: function(data) {
            console.error(data);
        }
    });
}