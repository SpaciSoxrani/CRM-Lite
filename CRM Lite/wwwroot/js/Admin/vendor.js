$(document).ready(function () {

	var id = location.href.split('/')[location.href.split('/').length - 1];
	if ((id != "Vendor") && (id != "")) {
		document.getElementById("delete").style.display = 'block';
		FillFields(id);
	}
	else
		GetFields();
});



function GetFields(vendor) {
	if (vendor != undefined)
		$("#name").val(vendor.name);

	$.ajax({
		url: `${api}/api/ProductLines`,
		success: function (data) {
			$.each(data, function (idx, a) {
				$("#product-line").append(new Option(a.name, a.id));
			});
			if (vendor != undefined)
				$("#product-line").val(vendor.productLineId)
			else
				$("#product-line").val("")
        },
        xhrFields: {
            withCredentials: true
        }
	});

	$.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
		success: function (data) {
			$.each(data, function (idx, a) {
				$("#responsible").append(new Option(a.displayName, a.id));
			});
			if (vendor != undefined)
				$("#responsible").val(vendor.responsibleUserId);
			else
				$("#responsible").val("")
        },
        xhrFields: {
            withCredentials: true
        }
	});
}

function FillFields(id) {
	$.ajax({
		type: "GET",
		url: `${api}/api/Vendors/${id}`,
		success: function (data) {
			GetFields(data)
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

function SaveVendor() {

	let vendorModel = {};
	vendorModel.name = $("#name").val();
	vendorModel.responsibleUserId = $("#responsible").val();
	vendorModel.productLineId = $("#product-line").val();

	if ((vendorModel.name == "") || (vendorModel.responsibleUserId == null) || (vendorModel.productLineId == null)) {
		var ss = document.getElementById("error");
		if (ss.style.visibility == "visible") $('#error').toggle();
		ss.style.visibility = "visible";
		$('#error').fadeOut(4000);
		return;
	}
		
	let id = location.href.split('/')[location.href.split('/').length - 1];

	if ((id == "Vendor") || (id == "")) 
		NewVendor(vendorModel)
	else
		UpdateVendor(vendorModel, id)
	
}

function NewVendor(vendorModel) {
	$.ajax({
		type: "POST",
		url: `${api}/api/Vendors`,
		data: JSON.stringify(vendorModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/Vendors`;
			console.log(data);
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

function UpdateVendor(vendorModel, id) {
	vendorModel.vendorGuid = id;

	$.ajax({
		type: "PUT",
		url: `${api}/api/Vendors/${id}/${user.id}`,
		data: JSON.stringify(vendorModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/Vendors`;
			console.log(data);
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

function DeleteVendor() {
	let id = location.href.split('/')[location.href.split('/').length - 1];

	$.ajax({
		type: "Delete",
		url: `${api}/api/Vendors/${id}`,
		success: function (data) {
			window.location.href = `/Vendors`;
			console.log(data);
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

