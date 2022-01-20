$(document).ready(function () {
	document.querySelector('body').classList.add('sidebar-hidden');
	$("#kanban select").select2({
		placeholder: "Выберите элемент",
		allowClear: true
	});

	GetFields();
    GetDeals(true);
    GetProductRequests();
});

function GetDeals(myDeals) {
	var deals = [];
	$('#verification').empty();
	$('#development').empty();
	$('#negotiating').empty();
	$('#contest').empty();
	$('#contract-signed').empty();
	$('#contract-works').empty();
    $('#contract-closed').empty();

	$.ajax({
		type: "GET",
        url: `${api}/api/DealsWithFourFieldsById/${user.id}`,
		success: function (data) {
			deals = data;
			FillKanban(data, myDeals);
		},
		error: function (data) {
			alert(data);
		},
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
	});

    $('#filter').on('click',
        function() {
            Filter(deals);
        });
}

function GetFields() {

	$.ajax({
        url: `${location.origin}/Organizations/GetOrganizations`,
		success: function (data) {
			$.each(data, function (idx, a) {
				$('#client').append(new Option(a.shortName, a.id));
			});
			$('#client').val(null);
        },
        xhrFields: {
            withCredentials: true
        }
	});

	$.ajax({
		url: `${api}/api/GetActiveDepartments`,
		success: function (data) {
			$.each(data, function (idx, a) {
				$('#department').append(new Option(a.name, a.id));
			});
			$('#department').val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Departments`,
        success: function (data) {
            $.each(data, function (idx, a) {
                if (a.canSell && a.parentDepartmentId !== null)
                    $('#section').append(new Option(a.name, a.id));
            });
            $('#section').val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });

    $.ajax({
        url: `${api}/api/Users/GetSalesUsers`,
        success: function (data) {
            $.each(data, function (idx, a) {
                $('#man').append(new Option(a.displayName, a.id));
            });

            $('#man').val(null);
        },
        xhrFields: {
            withCredentials: true
        }
    });
	
	$('#department').on("change", function () {
		$('#section').empty();
        $.ajax({
            url: `${api}/api/Departments`,
            success: function (data) {
                $.each(data, function (idx, a) {
                    if (a.canSell && a.parentDepartmentId === $('#department').val())
                        $('#section').append(new Option(a.name, a.id));
                });

                $('#section').val(null);
            },
            xhrFields: {
                withCredentials: true
            }
        });

		$('#section').val(null);
	});

	$('#section').on("change", function () {
		let sectionId = $('#section').val();
		$('#man').empty();
		$.ajax({
            url: `${api}/api/Users/PeoplesForKanban/${sectionId}`,
			success: function (data) {
				$.each(data, function (idx, a) {
					if (a.departmentId === sectionId) {
						$('#man').append(new Option(a.displayName, a.id));
					}
                });

                $('#man').val(null);
            },
            xhrFields: {
                withCredentials: true
            }
		});
	})

    $('#my-deals').on("change",
        function() {
            if ($('#my-deals').prop('checked'))
                $('#man').prop('disabled', true);
            else
                $('#man').prop('disabled', false);
        });
}

function Filter(data) {
	let filterDeal = data;
	let myDeal = $('#my-deals').prop('checked');

	if (!myDeal)
		if ($('#man').val() !== null)
			filterDeal = filterDeal.filter(o => o.responsibleUserId === $('#man').val());

	//department
	if ($('#department').val() !== null) {
		filterDeal = filterDeal.filter(o => o.salesDepartmentDealId === $('#department').val());
		if ($('#section').val() !== null)
			filterDeal = filterDeal.filter(o => o.salesUnitDealId === $('#section').val());
	}

	//name
	if ($('#short-name').val() !== "") {
		filterDeal = filterDeal.filter(o => o.shortName !== null);
		filterDeal = filterDeal.filter(o => o.shortName.toUpperCase().indexOf($('#short-name').val().toUpperCase()) !== -1);
	}
	//client
	if ($('#client').val() !== null)
		filterDeal = filterDeal.filter(o => o.organizationId === $('#client').val());


	//create
	if ($('#first-date-created').val() !== "") {
		filterDeal = filterDeal.filter(o => o.createdDate.substring(0, 10) >= $('#first-date-created').val());
		if ($('#last-date-created').val() !== "")
			filterDeal = filterDeal.filter(o => o.createdDate.substring(0, 10) <= $('#last-date-created').val());
	}
	else
		if ($('#last-date-created').val() !== "")
			filterDeal = filterDeal.filter(o => o.createdDate.substring(0, 10) <= $('#last-date-created').val());	

	//change
	if ($('#first-date').val() !== "") {
		filterDeal = filterDeal.filter(o => o.changedDate.substring(0, 10) >= $('#first-date').val());
		if ($('#last-date').val() !== "")
			filterDeal = filterDeal.filter(o => o.changedDate.substring(0, 10) <= $('#last-date').val());
	}
	else
		if ($('#last-date').val() !== "")
			filterDeal = filterDeal.filter(o => o.changedDate.substring(0, 10) <= $('#last-date').val());	



	FillKanban(filterDeal, myDeal);
}

function FillKanban(data, myDeals) {

	$('#verification').empty();
	$('#development').empty();
	$('#negotiating').empty();
	$('#contest').empty();
	$('#contract-signed').empty();
	$('#contract-works').empty();
	$('#contract-closed').empty();

	$.each(data, function (idx, a) {

		if (myDeals)
			if (a.responsibleUserId !== user.id)
                return;

        if (a.isClosed)
            return;

        let color = "white";

        switch (a.dealStatus) {
            case 'Отложенная':
                color = "wheat";
                break;
            case 'Закрытая \"Потеря\"':
            case 'Потеря':
                color = "#b55b5b";
                break;
            case 'Закрытая \"Выигрыш\"':
            case 'Выигрыш':
                color = "#8bc78d";
                break;
        }
		let deal = "<div class=\"kanban-item\" style=\"cursor: pointer; background-color:" + color + "\" onclick=\"window.location.href = `/Deals/Deal/" + a.id + "`;\">" + a.name + "</div>";
		switch (a.stepNumber) {
			case 1:
				$('#verification').append(deal);
				return;
			case 2:
				$('#development').append(deal);
				return;
			case 3:
				$('#negotiating').append(deal);
				return;
			case 4:
				$('#contest').append(deal);
				return;
			case 5:
				$('#contract-signed').append(deal);
				return;
			case 6:
				$('#contract-works').append(deal);
				return;
			case 7:
				$('#contract-closed').append(deal);
				return;
		}
		return;
	});
}

var GetProductRequests = () => {

    var requests = [];
    $('#request-start').empty();
    $('#request-in-process').empty();
    $('#request-done').empty();

    $.ajax({
        type: "GET",
        url: `${api}/api/ProductRequests/KanbanRequests/${user.id}`,
        success: function(data) {
            requests = data.result;
            FillRequestKanban(requests);
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

var FillRequestKanban = (data) => {

    $('#request-start').empty();
    $('#request-in-process').empty();
    $('#request-done').empty();

    $.each(data, function (idx, a) {

        let color = "white";

        let request = "<div class=\"kanban-item\" style=\"cursor: pointer; background-color:" +
            color +
            "\" onclick=\"window.location.href = `/ProductRequests/ProductRequest/" +
            a.id +
            "`;\">" +
            a.name +
            "</div>";

        if (a.isFinished) {
            $('#request-done').append(request);
            return;
        }

        if (a.answerDate) {
            $('#request-in-process').append(request);
            return;
        }

        $('#request-start').append(request);
    });
}