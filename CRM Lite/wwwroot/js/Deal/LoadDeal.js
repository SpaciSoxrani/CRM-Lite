function LoadEmptyDeal() {

	var dealProbability = $('#verification-is-probable');
	$.ajax({
		url: `${api}/api/DealProbability`,
		success: function (data) {
			$.each(data, function (idx, a) {
				dealProbability.append(new Option(a.value, a.key));
			});
            dealProbability.val("1");
        },
        xhrFields: {
            withCredentials: true
        }
    });

    var responsibleUsers = $('#verification-step-responsible');
    responsibleUsers.empty();

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            $.each(data, function (idx, a) {
                responsibleUsers.append(new Option(a.displayName, a.id));
            });
            responsibleUsers.val(user.id);
            responsibleUsers.removeAttr('disabled');
        },
        xhrFields: {
            withCredentials: true
        }
    });	


    var organizations = $('#verification-step-organization');

	$.ajax({
        url: `${location.origin}/Organizations/GetOrganizations`,
		success: function (data) {
			$.each(data, function (idx, a) {
				organizations.append(new Option(a.shortName, a.id));
			});
			organizations.val(null);
			organizations.removeAttr("disabled");
        },
        xhrFields: {
            withCredentials: true
        },
        error: function(err) {
            console.error(err);
        }
    });

    organizations.change(function () {
        var contacts = $('#verification-step-contact');
        var decisionMakers = $('#verification-step-decision-maker');
        var peopleOfInterest = $("#verification-step-people-of-interest");

        peopleOfInterest.empty().attr('disabled', 'disabled');;
        contacts.empty().attr('disabled', 'disabled');;
        decisionMakers.empty().attr('disabled', 'disabled');;

        var opt = {
            "Контакты из организации": [],
            "Другие контакты": []
        };

		if (organizations.val() !== null) {
			$.ajax({
                url: `${location.origin}/Contacts/Short`,
				success: function (data) {
                    var peoples = [];

                    $.each(data, function (idx, a) {
                        if (a.organizationId === organizations.val()) {
                            opt["Контакты из организации"].push(new Option(a.displayName, a.id));
                            peoples.push(new Option(a.id, a.displayName));
                        } else
                            opt["Другие контакты"].push(new Option(a.displayName, a.id));
                    });

                    window.EnableSearchingAnotherContacts([
                        contacts, decisionMakers, peopleOfInterest
                    ], opt);

					if (peoples.length === 1) {
                        contacts.val(peoples[0].innerText).trigger('change');
                        decisionMakers.val(peoples[0].innerText).trigger('change');
                        peopleOfInterest.val(peoples[0].innerText).trigger('change');
					} else {
						contacts.val(null);
						decisionMakers.val(null);
						peopleOfInterest.val(null);
                    }

                    peopleOfInterest.removeAttr('disabled');
                    contacts.removeAttr('disabled');
                    decisionMakers.removeAttr('disabled');

                },
                xhrFields: {
                    withCredentials: true
                }
            });

        }
    });

	var industrialDepartments = $('#verification-step-industrial-departments');
	var salesDepartments = $('#verification-step-sales-departments');
	var productUnits = $('#verification-step-product-units');
	var salesUnits = $('#verification-step-sales-units');
	var industrialUnits = $('#verification-step-industrial-units');
	var contestProcedure = $('#verification-step-contest-procedure');
	var dealType = $('#verification-step-deal-type');
	var productLine = $('#verification-step-product-line');
	var purchaseInterval = $('#verification-step-purchase-interval');
	let productLinesData;
	let dealTypeData;

	$.ajax({
		url: `${api}/api/GetActiveDepartments`,
		success: function (data) {
			$.each(data, function (idx, a) {
				industrialDepartments.append(new Option(a.name, a.id));
				salesDepartments.append(new Option(a.name, a.id));				
			});
			industrialDepartments.val(null);
			industrialDepartments.removeAttr("disabled");
			salesDepartments.val(null);
			salesDepartments.removeAttr("disabled");
        },
        xhrFields: {
            withCredentials: true
        }
	});
	$.ajax({
		url: `${api}/api/dealTypes`,
		success: function (data) {
			dealTypeData = data;
        },
        xhrFields: {
            withCredentials: true
        }
	});

	productLine.on("change", GetSurvey);

	$.ajax({
		url: `${api}/api/ProductLines`,
		success: function (data) {
			productLinesData = data;
        },
        xhrFields: {
            withCredentials: true
        }
	});

	salesDepartments.on("change", function () {
		salesUnits.find('option').remove().end();
		var salesUnitArray = [];
		$.ajax({
			url: `${api}/api/GetProductAndSalesUnitsByParentDepartmentId/${salesDepartments.val()}`,
			success: function (data) {
				$.each(data, function (idx, a) {
						if (a.canSell) {
							salesUnitArray.push(new Option(a.id, a.name));
							salesUnits.append(new Option(a.name, a.id));
						}					
				});

				if (salesUnitArray.length !== 1)
					salesUnits.val(null);
				else
					salesUnits.val(salesUnitArray[0].innerText);

				if (salesDepartments.val() !== null) {
                    salesUnits.removeAttr('disabled');
				} else {
					productUnits.attr('disabled', 'disabled');
					salesUnits.attr('disabled', 'disabled');
				}
            },
            xhrFields: {
                withCredentials: true
            }
		});
	});
    industrialDepartments.on("change", function () {
        productUnits.find('option').remove().end();
        industrialUnits.find('option').remove().end();

		var show = document.getElementById("verification-step-file-show-survey");
        show.style.display = 'none';

        var productUnitArray = [];
		var industrialUnitArray = [];
		$.ajax({
			url: `${api}/api/GetIndustrialUnitsByParentDepartmentId/${industrialDepartments.val()}`,
			success: function (data) {
                $.each(data, function (idx, a) {

                    if (a.canProduct) {
                        productUnitArray.push(new Option(a.id, a.name));
                        productUnits.append(new Option(a.name, a.id));
                    }

                    if (a.canExecute) {
                        industrialUnitArray.push(new Option(a.id, a.name));
                        industrialUnits.append(new Option(a.name, a.id));
                    }
                });

                if (productUnitArray.length !== 1)
                    productUnits.val(null);
                else
                    productUnits.val(productUnitArray[0].innerText);

				if (industrialUnitArray.length !== 1)
					industrialUnits.val(null);
				else
					industrialUnits.val(industrialUnitArray[0].innerText);

                if (industrialDepartments.val() !== null) {
                    industrialUnits.removeAttr('disabled');
                    productUnits.removeAttr('disabled');
                } else {
                    industrialUnits.attr('disabled', 'disabled');
                    productUnits.attr('disabled', 'disabled');
                }

                dealType.find('option').remove().end();
				$.each(dealTypeData, function (idx, a) {
					if (a.departmentId === industrialDepartments.val()) {
						dealType.append(new Option(a.name, a.id));
					}
				});
				dealType.val(null);
				productLine.find('option').remove().end();
				$.each(productLinesData, function (idx, a) {
					if (a.departmentId === industrialDepartments.val())
						productLine.append(new Option(a.name, a.id));
				});
				productLine.val(null);
				if (industrialDepartments.val() !== null) {
					productLine.removeAttr('disabled');
					dealType.removeAttr('disabled');
				} else {
					productLine.attr('disabled', 'disabled');
					dealType.attr('disabled', 'disabled');
				}

            },
            xhrFields: {
                withCredentials: true
            }
		});
	});

	$.ajax({
		url: `${api}/api/SelectionProcedures`,
		success: function (data) {
			$.each(data, function (idx, a) {
				contestProcedure.append(new Option(a.name, a.id));
			});
			contestProcedure.val(null);
			contestProcedure.removeAttr("disabled");
        },
        xhrFields: {
            withCredentials: true
        }
	});

	$.ajax({
		url: `${api}/api/PurchaseTimeIntervals`,
		success: function (data) {
			$.each(data, function (idx, a) {
				purchaseInterval.append(new Option(a.name, a.id));
			});
			purchaseInterval.val(null);
			purchaseInterval.removeAttr("disabled");
        },
        xhrFields: {
            withCredentials: true
        }
	});
}
