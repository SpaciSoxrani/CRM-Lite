function createLead() {
    if (!tableEditFields.checkIsLockEdit()) {
        openModalNew();
        getLeadFields();
        $("#lead-new-project").val("");
        $("#lead-new-content").val("");
    }
}

function saveLead(element) {
    if (!checkRequiredFields()) {
        formIsInvalid.fire();
        return;
    }

    let dateNow = new Date();
    dateNow.setHours(12);

    var lead = {};
    lead.projectId = $("#lead-new-project").val();
    lead.project = $("#lead-new-project option:selected").text() === 'Не выбрано' ? '' : $("#lead-new-project option:selected").text();
    lead.content = $("#lead-new-content").val();
    lead.receiptDate = dateNow;

    var leadDto = {
        projectId: lead.projectId,
        content: lead.content,
        receiptDate: lead.receiptDate
    };

    $('.btn').attr('disabled', true);
    $(element).html($(element).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    pushLead(element, leadDto, lead);
}

function pushLead(element, leadDto, lead) {
    tableEditFields.currentOpenEditField = null;
    $.ajax({
        type: 'POST',
        url: `${api}/api/Leads/CreateLead`,
        data: JSON.stringify(leadDto),
        contentType: "application/json",
        success: function (data) {
            console.log(data);

            $(element).find('.fa').remove();
            $('.btn').attr('disabled', false);
            lead.id = data.id;
            lead.changedDate = data.changedDate;

            tableEditFields.tableData.push(lead);
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

function deleteLead(id) {
    deleteWarning.fire({
        title: "Вы действительно хотите удалить лид?",
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "PUT",
                url: `${api}/api/Leads/DeleteLead/${id}`,
                success: function (data) {
                    tableEditFields.tableData = tableEditFields.tableData.filter(lead => lead.id != id);
                    window.contactData = tableEditFields.tableData;
                    filterItems();
                    filterItems();
                },
                error: function (data) {
                    showErrorWindow(data.status);
                }
            });
        }
    });
}

function getLeadFields() {
    var leadProjects = $('#lead-new-project');

    if (leadProjects.length > 0) {
        $.ajax({
            url: `${api}/api/Leads/LeadProjects`,
            success: function (data) {
                if (leadProjects[0].length < 2) {
                    $.each(data,
                        function (idx, a) {
                            leadProjects.append(new Option(a.name, a.id));
                        });
                }
                leadProjects.selectpicker('refresh');
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

function getLeadDto(lead) {
    return {
        id: lead.id,
        projectId: lead.projectId,
        receiptDate: lead.receiptDate,
        content: lead.content,
        result: lead.result,
        comments: lead.comments,
        targetId: lead.targetId,
        resultComments: lead.resultComments,
        responsibleUserId: lead.responsibleUserId,
        dayAppointment: lead.dayAppointment,
        statusId: lead.statusId,
        editFieldName: tableEditFields.currentOpenEditField.fieldName
    }
}

function downloadFile() {
    window.location.href = `${api}/api/Leads/GetLeadRept/`;
}