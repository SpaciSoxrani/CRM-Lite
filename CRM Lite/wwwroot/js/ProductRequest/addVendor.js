
function AddVendor() {
    let content = $('#vendors-block');
    let id = content[0].children.length;

    content.append("<div class=\"row added-vendor\" style=\"padding: 0px\"> <div class=\"form-group col-md-3\" style =\"padding-top: 0px;\"><label for=\"vendor" + id + "\">Вендор</label>" +
        "<br />	<select class=\"form-control\" onchange=\"fillResponsiblePeoples('" + id + "');\" style=\"width:100%; height:2.5em;\" id=\"vendor" + id + "\"></select>	</div>" +
        "<div class=\"form-group col-md-3\" style=\"padding-top: 0px;\"> <label for=\"responsible-product" + id + "\">Ответственный продакт</label>" +
        "<br />	<select class=\"form-control\" style=\"width:100%; height:2.5em;\" id=\"responsible-product" + id + "\"></select></div> " +
        "<div class=\"form-group col-md-3\" style =\"padding-top: 23px;\">" +
        "<input onclick=\"deleteAddedVendor(this)\" type=\"button\" class=\"btn btn-warning rounded\" value=\"Удалить\">" +
        "</div>" +
        "</div>");

    $("#vendor" + id + ', ' + "#responsible-product" + id).select2({
        placeholder: "Выберите элемент",
        allowClear: true
    });

    $.each(window.users,
        function (idx, a) {
            $("#responsible-product" + id).append(new Option(a.displayName, a.id));
        });

    $("#responsible-product" + id).val(null);

    $.each(window.vendors,
        function (idx, a) {
            $("#vendor" + id).append(new Option(a.name, a.id));
        });

    $("#vendor" + id).val(null);
}

function deleteAddedVendor(element) {
    $(element).closest('.added-vendor').remove();
}

function fillResponsiblePeoples(vendorRequestCount) {

    var vendor = $('#vendor' + vendorRequestCount);
    var responsible = $("#responsible-product" + vendorRequestCount);

    if (vendor.val() === null)
        return;

    $.ajax({
        url: `${api}/api/Vendors/${vendor.val()}`,
        success: function (data) {
            responsible.val(data.responsibleUserId).trigger("change");
        },
        xhrFields: {
            withCredentials: true
        }
    });

}