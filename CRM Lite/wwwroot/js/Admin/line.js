$(document).ready(function () {

	var id = location.href.split('/')[location.href.split('/').length - 1];
	if ((id != "ProductLine") && (id != "")) {
		document.getElementById("delete").style.display = 'block';
		FillFields(id);
	}
	else
		GetFields();
});



function GetFields(line) {
	if (line != undefined)
		$("#name").val(line.name);

	$.ajax({
		url: `${api}/api/GetActiveDepartments`,
		success: function (data) {
			$.each(data, function (idx, a) {				
					$("#department").append(new Option(a.name, a.id));
			});
			if (line != undefined)
				$("#department").val(line.departmentId)
			else
				$("#department").val("")
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
			if (line != undefined)
				$("#responsible").val(line.responsibleId);
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
		url: `${api}/api/ProductLines/${id}`,
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

function SaveLine() {

	let lineModel = {};
	lineModel.name = $("#name").val();
	lineModel.departmentId = $("#department").val();
	lineModel.responsibleId = $("#responsible").val();

	if ((lineModel.name == "") || (lineModel.departmentId == null)) {
		var ss = document.getElementById("error");
		if (ss.style.visibility == "visible") $('#error').toggle();
		ss.style.visibility = "visible";
		$('#error').fadeOut(4000);
		return;
	}

	let id = location.href.split('/')[location.href.split('/').length - 1];

	if ((id == "ProductLine") || (id == "")) 
		NewLine(lineModel)
	else
		UpdateLine(lineModel, id)

}

function NewLine(lineModel) {
	$.ajax({
		type: "POST",
		url: `${api}/api/ProductLines`,
		data: JSON.stringify(lineModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/ProductLines`;
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

function UpdateLine(lineModel, id) {
	lineModel.id = id;
	//fix не передается в контроллер
	$.ajax({
		type: "PUT",
		url: `${api}/api/ProductLines/${id}/${user.id}`,
		data: JSON.stringify(lineModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/ProductLines`;
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

function DeleteLine() {
	let id = location.href.split('/')[location.href.split('/').length - 1];

	$.ajax({
		type: "Delete",
		url: `${api}/api/ProductLines/${id}`,
		success: function (data) {
			window.location.href = `/ProductLines`;
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

