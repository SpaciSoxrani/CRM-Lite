$(document).ready(function () {

	var id = location.href.split('/')[location.href.split('/').length - 1];
	if ((id != "DealType") && (id != "")) {
		document.getElementById("delete").style.display = 'block';
		FillFields(id);
	}
	else
		GetFields();
});



function GetFields(type) {
	if (type != undefined)
		$("#name").val(type.name);

	$.ajax({
		url: `${api}/api/GetActiveDepartments`,
		success: function (data) {
			$.each(data, function (idx, a) {				
					$("#department").append(new Option(a.name, a.id));
			});
			if (type != undefined)
				$("#department").val(type.departmentId)
			else
				$("#department").val("")
        },
        xhrFields: {
            withCredentials: true
        }
	});
}

function FillFields(id) {
	$.ajax({
		type: "GET",
		url: `${api}/api/DealTypes/${id}`,
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

function SaveType() {

	let typeModel = {};
	typeModel.name = $("#name").val();
	typeModel.departmentId = $("#department").val();

	if ((typeModel.name == "") || (typeModel.departmentId == null)) {
		var ss = document.getElementById("error");
		if (ss.style.visibility == "visible") $('#error').toggle();
		ss.style.visibility = "visible";
		$('#error').fadeOut(4000);
		return;
	}

	let id = location.href.split('/')[location.href.split('/').length - 1];

	if ((id == "DealType") || (id == ""))
		NewType(typeModel)
	else
		UpdateType(typeModel, id)

}

function NewType(typeModel) {
	$.ajax({
		type: "POST",
		url: `${api}/api/DealTypes`,
		data: JSON.stringify(typeModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/DealTypes`;
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

function UpdateType(typeModel, id) {
	typeModel.id = id;
	//fix не передается в контроллер
	$.ajax({
		type: "PUT",
		url: `${api}/api/DealTypes/${id}/${user.id}`,
		data: JSON.stringify(typeModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/DealTypes`;
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

function DeleteType() {
	let id = location.href.split('/')[location.href.split('/').length - 1];

	$.ajax({
		type: "Delete",
		url: `${api}/api/DealTypes/${id}`,
		success: function (data) {
			window.location.href = `/DealTypes`;
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

