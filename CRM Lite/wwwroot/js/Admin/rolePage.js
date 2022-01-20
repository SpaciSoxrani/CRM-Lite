$(document).ready(function() {

    $.ajax({
        url: `${api}/api/Users/IdsAndNames/Active`,
        success: function (data) {
            var employees = $('#employees');
            $.each(data, function (idx, a) {
                employees.append(new Option(a.displayName, a.id));
            });
            $("#employees").val(user.id);
            LoadRoles();
        },
        xhrFields: {
            withCredentials: true
        }
    });
});

var LoadRoles = () => {
    let id = $('#employees').val();
    $.ajax({
        type: 'POST',
        url: location.origin + "/Admin/GetUserRoles",
        data: {
            id: id
        },
        success: function (data) {
            $("#roles-container > ul").html(data);
            // чтобы админ не снял роль сам себе
            $("#roles-container .list-group-item").each(function () {
                if (this.innerText === "Администратор" && user.id === $('#employees').val())
                    $(this).find("input:checkbox").prop('disabled', true);
            });
        },
        xhrFields: {
            withCredentials: true
        }
    });
};