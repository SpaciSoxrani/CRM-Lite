var contractDateData;

$(function () {
    document.querySelector("body").classList.add("sidebar-hidden");

    LoadRequestInfo().catch((err) => {
        console.error(err);
    });

    $("#services-request select").select2({
        placeholder: "Выберите элемент",
        allowClear: true
    });
});

async function LoadRequestInfo() {
    let contractDate = $('#contract-date').datepicker({
        todayButton: new Date(),
        autoClose: true
    });

    contractDateData = contractDate.datepicker().data('datepicker');

    if(window.serviceRequest.isStarted)
        window.initModalToChangeUnit();

    if (window.serviceRequest.contractDate !== null)
        contractDateData.selectDate(new Date(window.serviceRequest.contractDate));

    await window.fetch(`${api}/api/GetIndustrialUnitsByParentDepartmentIdForService/${window.serviceRequest.departmentId}`,
            {
                credentials: 'include'
            })
        .then((res) => res.json())
        .then((deps) => {
            let industrialUnitIds = window.serviceRequest.industrialUnitServicesRequests.map(u => u.industrialUnitId);
            for (let department of deps) {
                $('#industrial-units').append(new Option(department.name, department.id));
                $('#industrial-units').val(industrialUnitIds);

                if (canPointMp && ~industrialUnitIds.indexOf(department.id)) {
                    $('#user-unit').append(new Option(department.name, department.id));
                    $('#user-unit').val(user.departmentId);
                }
            }
        })
        .catch((err) => {
            console.error(err);
        });

    await window.fetch(`${api}/api/Users/IdsAndNames/Active`,
            {
                credentials: 'include'
            })
        .then((res) => res.json())
        .then((users) => {
            let anotherResponsibleIds = window.serviceRequest.anotherResponsiblesServicesRequests.map(u => u.responsibleId);
            for (let resp of users) {
                $('#another-responsibles').append(new Option(resp.displayName, resp.id));
                $('#another-responsibles').val(anotherResponsibleIds).trigger("change");;

                if (canPointMp) {
                    $('#add-mp').append(new Option(resp.displayName, resp.id));
                    $('#add-mp').val(null).trigger("change");
                }
            }
        })
        .catch((err) => {
            console.error(err);
        });
}