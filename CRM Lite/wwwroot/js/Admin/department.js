$(document).ready(function () {

	var id = location.href.split('/')[location.href.split('/').length - 1];
	if ((id != "Department") && (id != "")) {
		document.getElementById("delete").style.display = 'block';
		FillFields(id);
	}
	else
		GetFields();
});

function GetFields(department) {
	if (department != undefined) {
		$("#name").val(department.name);
		$("#isActive").prop('checked', department.isActive);
		$("#isExecute").prop('checked', department.canExecute);
		$("#isProduct").prop('checked', department.canProduct);
		$("#isSell").prop('checked', department.canSell);
	}
	$.ajax({
		url: `${api}/api/GetActiveDepartments`,
		success: function (data) {
			$.each(data, function (idx, a) {				
				$("#parent-department").append(new Option(a.name, a.id));
			});
			if (department != undefined)
				$("#parent-department").val(department.parentDepartmentId)
			else
				$("#parent-department").val("")
        },
        xhrFields: {
            withCredentials: true
        }
	});

	$.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
		success: function (data) {
			$.each(data, function (idx, a) {
				$("#manager").append(new Option(a.displayName, a.id));
			});
			if (department != undefined)
				$("#manager").val(department.managerFromAD);
			else
				$("#manager").val("")
        },
        xhrFields: {
            withCredentials: true
        }
	});
}

function FillFields(id) {
	$.ajax({
		type: "GET",
		url: `${api}/api/Departments/${id}`,
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

function SaveDepartment() {

	let departmentModel = {};
	departmentModel.name = $("#name").val();
    departmentModel.managerFromAD = $("#manager").val();
    departmentModel.managerId = $("#manager").val();
	departmentModel.parentDepartmentId = $("#parent-department").val();
	departmentModel.isActive = $("#isActive").prop('checked');
	departmentModel.canExecute = $("#isExecute").prop('checked');
	departmentModel.canProduct = $("#isProduct").prop('checked');
	departmentModel.canSell = $("#isSell").prop('checked');

	if (departmentModel.name == "") {
		var ss = document.getElementById("error");
		if (ss.style.visibility == "visible") $('#error').toggle();
		ss.style.visibility = "visible";
		$('#error').fadeOut(4000);
		return;
	}

	let id = location.href.split('/')[location.href.split('/').length - 1];

	if ((id == "Department") || (id == ""))
		NewDepartment(departmentModel)
	else
		UpdateDepartment(departmentModel, id)

}

function NewDepartment(departmentModel) {
	$.ajax({
		type: "POST",
		url: `${api}/api/Departments`,
		data: JSON.stringify(departmentModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/Departments`;
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

function UpdateDepartment(departmentModel, id) {
	departmentModel.id = id;

	$.ajax({
		type: "PUT",
		url: `${api}/api/Departments/${id}/${user.id}`,
		data: JSON.stringify(departmentModel),
		contentType: "application/json",
		success: function (data) {
			window.location.href = `/Departments`;
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

function DeleteDepartment() {
	let id = location.href.split('/')[location.href.split('/').length - 1];

	$.ajax({
		type: "Delete",
		url: `${api}/api/Departments/${id}`,
		success: function (data) {
			window.location.href = `/Departments`;
			console.log(data);
		},
		error: function (data) {
			alert("Удаление невозможно! В этом департаменте есть люди.");
		},
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
	});
}

