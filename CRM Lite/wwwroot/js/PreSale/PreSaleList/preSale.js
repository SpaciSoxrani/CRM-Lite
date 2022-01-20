var preSaleRegions;

function createPreSale() {
    if (!tableEditFields.checkIsLockEdit()) {
        openModalNew();
        getPreSaleFields();
        $("#pre-sale-new-organization").val("");
        $("#pre-sale-new-region").val("");
    }
}

function savePreSale(element) {
    if (!checkRequiredFields()) {
        formIsInvalid.fire();
        return;
    }

    var preSale = {};
    preSale.organization = $("#pre-sale-new-organization").val();
    preSale.regionId = $("#pre-sale-new-region").val();
    preSale.region = $("#pre-sale-new-region option:selected").text() === 'Не выбрано' ? '' : $("#pre-sale-new-region option:selected").text();
    preSale.groupId = window.preSaleGroupId;

    var preSaleDto = {
        organization: preSale.organization,
        regionId: preSale.regionId,
        groupId: preSale.groupId,
    };

    $('.btn').attr('disabled', true);
    $(element).html($(element).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    postPreSale(element, preSaleDto, preSale);
}

function postPreSale(element, preSaleDto, preSale) {
    tableEditFields.currentOpenEditField = null;

    $.ajax({
        type: 'POST',
        url: `${location.origin}/PreSales/CreatePreSale`,
        data: JSON.stringify(preSaleDto),
        contentType: "application/json",
        success: function (data) {
            console.log(data);

            $(element).find('.fa').remove();
            $('.btn').attr('disabled', false);
            preSale.id = data.id;
            tableEditFields.editRelatedField('region', preSale);

            preSale.changedDate = data.changedDate;

            tableEditFields.tableData.push(preSale);
            window.contactData = tableEditFields.tableData;
            filterItems();

            requestSuccessful.fire()
                .then(() => {
                    closeModalNew();
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

function deletePreSale(id) {
    deleteWarning.fire({
        title: "Вы действительно хотите удалить контакт?",
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "DELETE",
                url: `${location.origin}/PreSales/DeletePreSale/${id}`,
                success: function (data) {
                    tableEditFields.tableData = tableEditFields.tableData.filter(preSale => preSale.id != id);
                    window.contactData = tableEditFields.tableData;
                    filterItems();
                },
                error: function (data) {
                    showErrorWindow(data.status);
                }
            });
        }
    });
}

function getPreSaleFields() {
    var preSaleRegion = $('#pre-sale-new-region');

    if (preSaleRegion.length > 0) {
        $.ajax({
            url: `${location.origin}/PreSales/PreSaleRegions`,
            success: function (data) {
                if (preSaleRegion[0].length < 2) {
                    $.each(data,
                        function (idx, a) {
                            preSaleRegion.append(new Option(a.name, a.id));
                        });
                }
                preSaleRegion.selectpicker('refresh');
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON'
        });
    }
}

function checkIsEmptiness(value) {
    return !value || value.length === 0;
}

function getPreSaleDto(preSale) {
    return {
        id: preSale.id,
        organization: preSale.organization,
        fullName: preSale.fullName,
        jobTitle: preSale.jobTitle,
        phoneNumber: preSale.phoneNumber,
        email: preSale.email,
        site: preSale.site,
        requestSent: preSale.requestSent,
        incomingNumber: preSale.incomingNumber,
        executorContact: preSale.executorContact,
        comments: preSale.comments,
        resultComments: preSale.resultComments,
        responsibleUserId: preSale.responsibleUserId,
        dayAppointment: preSale.dayAppointment,
        statusId: preSale.statusId,
        resultId: preSale.resultId,
        regionId: preSale.regionId,
        groupId: window.preSaleGroupId,
        editFieldName: tableEditFields.currentOpenEditField.fieldName
    }
}

function downloadFile() {
    window.location.href = `${location.origin}/PreSales/GetPreSaleRept/${window.preSaleGroupId}`;
}