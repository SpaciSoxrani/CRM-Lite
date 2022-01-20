let preSaleGroupModel;
var isEdit = false;

function editPreSaleGroup(id) {
    isEdit = true;
    if (id !== "")
        $.ajax({
            type: "GET",
            url: `${location.origin}/PreSales/PreSaleGroup/${id}`,
            success: function (data) {
                openModalNew();
                preSaleGroupModel = data;
                getPreSaleGroupFields();
                fillPreSaleGroupFields();
            },
            error: function (data) {
                showErrorWindow(data.status);
            },
            dataType: 'JSON'
        });
    else
        getPreSaleGroupFields();
}

function createPreSaleGroup() {
    isEdit = false;
    preSaleGroupModel = null;
    $("#pre-sale-group-new-name").val("");
    $("#pre-sale-group-new-status").val("");
    $("#pre-sale-group-new-department").val("");
    openModalNew();
    getPreSaleGroupFields();
}

function savePreSaleGroup(element) {
    if (!checkRequiredFields()) {
        formIsInvalid.fire();
        return;
    }

    var preSaleGroupDto = {};
    preSaleGroupDto.name = $("#pre-sale-group-new-name").val();
    preSaleGroupDto.statusId = $("#pre-sale-group-new-status").val();
    preSaleGroupDto.departmentId = $("#pre-sale-group-new-department").val();

    $('.btn').attr('disabled', true);
    $(element).html($(element).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    if (isEdit) {
        preSaleGroupDto.id = preSaleGroupModel.id;
        createOrEditPreSale(element, preSaleGroupDto, "PUT");
    }
    else {
        createOrEditPreSale(element, preSaleGroupDto, "POST");
    }
}

function createOrEditPreSale(element, preSaleGroupDto, requestType) {
    let isPost = requestType === "POST";
    $.ajax({
        type: requestType,
        url: isPost
            ? `${location.origin}/PreSales/CreatePreSaleGroup`
            : `${location.origin}/PreSales/EditPreSaleGroup/${preSaleGroupDto.id}`,
        data: JSON.stringify(preSaleGroupDto),
        contentType: "application/json",
        success: function (data) {
            preSaleGroupDto.status = $("#pre-sale-group-new-status option:selected").text();
            preSaleGroupDto.department = $("#pre-sale-group-new-department option:selected").text()
            if (isPost) {
                preSaleGroupDto.id = data.id;
            }
            else {
                window.contactData = window.contactData.filter(group => group.id != preSaleGroupDto.id);
            }
            window.contactData.push(preSaleGroupDto);
            filterItems();

            console.log(data);
            requestSuccessful.fire()
                .then(() => {
                    $(element).find('.fa').remove();
                    $('.btn').attr('disabled', false);
                    closeModalNew();
                    if (isPost)
                        window.open(`/PreSales/${preSaleGroupDto.id}`, '_blank');
                });
        },
        error: function (data) {
            console.log(data);
            showErrorWindow(data.status)
            $(element).find('.fa').remove();
            $('.btn').attr('disabled', false);
            return;
        },
        dataType: 'JSON'
    });
}

function deletePreSaleGroup(id, name) {
    deleteWarning.fire({
        title: 'Вы действительно хотите удалить рассылку ' + '\"' + name + '\"?',
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: `${location.origin}/PreSales/DeletePreSaleGroup/${id}`,
                success: function (data) {
                    window.contactData = window.contactData.filter(group => group.id != id);
                    filterItems();
                },
                error: function (data) {
                    showErrorWindow(data.status);
                },
            });
        }
    });
}

function getPreSaleGroupFields() {
    var preSalesGroupStatus = $('#pre-sale-group-new-status');
    var preSalesGroupDepartment = $('#pre-sale-group-new-department');

    $.ajax({
        url: `${location.origin}/PreSales/PreSaleGroupStatuses`,
        success: function (data) {
            if (preSalesGroupStatus[0].length == 1) {
                $.each(data,
                    function (idx, a) {
                        preSalesGroupStatus.append(new Option(a.name, a.id));
                    });
            }
            if (preSaleGroupModel) {
                preSalesGroupStatus.val(preSaleGroupModel.statusId);
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });
    
    $.ajax({
        url: `${location.origin}/Departments/MainDepartments`,
        success: function (data) {
            if (preSalesGroupDepartment[0].length == 1) {
                $.each(data,
                    function (idx, a) {
                        preSalesGroupDepartment.append(new Option(a.name, a.id));
                    });
            }
            if (preSaleGroupModel) {
                preSalesGroupDepartment.val(preSaleGroupModel.departmentId);
            }
        },
        error: function (data) {
            alert(data);
        },
        dataType: 'JSON'
    });
}

function fillPreSaleGroupFields() {
    $("#pre-sale-group-new-status").val(preSaleGroupModel.departmentId);
    $("#pre-sale-group-new-department").val(preSaleGroupModel.statusId);
    $("#pre-sale-group-new-name").val(preSaleGroupModel.name);
}