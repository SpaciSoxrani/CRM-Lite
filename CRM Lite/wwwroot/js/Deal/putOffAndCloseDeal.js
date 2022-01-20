window.onload = function () {
    var modalPutOff = new RModal(document.getElementById('modal-put-off-deal'),
        {
            beforeOpen: function (next) {
                next();
            },
            beforeClose: function (next) {
                next();
            }
        });

    var modalFinishDeal = new RModal(document.getElementById('modal-finish-deal'),
        {
            beforeOpen: function (next) {
                next();
            },
            beforeClose: function (next) {
                next();
            }
        });

    var modalCloseDeal = new RModal(document.getElementById('modal-close-deal'),
        {
            beforeOpen: function (next) {
                next();
            },
            beforeClose: function (next) {
                next();
            }
        });

    document.addEventListener('keydown',
        function (ev) {
            modalPutOff.keydown(ev);
            modalFinishDeal.keydown(ev);
            modalCloseDeal.keydown(ev);
        },
        false);

    window.modalPutOff = modalPutOff;
    window.modalFinishDeal = modalFinishDeal;
    window.modalCloseDeal = modalCloseDeal;
};

function loadDealStatuses(stepNumber) {
    $.ajax({
        url: `${api}/api/GetWinOrLooseDealStatus`,
        success: function (data) {
            var ind = $('#finish-status');
            $.each(data, function (idx, a) {
                if (stepNumber === 7 && a.name === "Закрытая \"Выигрыш\"") {
                    ind.append(new Option(a.name, a.id));
                    $("#finish-status").val(a.id);
                    $(".put-off-deal").removeClass('col').hide();
                }
                if (stepNumber < 7 && a.name === "Закрытая \"Потеря\"") {
                    ind.append(new Option(a.name, a.id));
                    $("#finish-status").val(a.id);
                    $('.finish-comment').show();
                }
            });
            $("#finish-status").attr('disabled', 'disabled');
        },
        xhrFields: {
            withCredentials: true
        }
    });
}

function acceptToCloseDeal() {

    var isValid = true;
    $(`.finish-info select[required],
                .finish-info textarea[required]`).each(function () {
        const element = $(this);
        if ((element.val() === "" || element.val() === null
                || Array.isArray(element.val()) && !element.val().length) &&
            element.is(':visible')) {
            highlightRequiredElement(element);
            isValid = false;
        }
    });

    if (!isValid)
        return;

    let id = location.href.split('/')[location.href.split('/').length - 1];

    $.LoadingOverlay("show");

    let indDepartmentId = $('#verification-step-industrial-departments');
    let saleDepartmentId = $('#verification-step-sales-departments');
    let saleUnitId = $('#verification-step-sales-units');
    let productUnitId = $('#verification-step-product-units');
    let industrialUnitId = $('#verification-step-industrial-units');
    let productWays = $('#verification-step-product-line');

    if (indDepartmentId.val() === null || (Array.isArray(indDepartmentId.val()) && !indDepartmentId.val().length) ||
        saleDepartmentId.val() === null || (Array.isArray(saleDepartmentId.val()) && !saleDepartmentId.val().length) ||
        saleUnitId.val() === null || (Array.isArray(saleUnitId.val()) && !saleUnitId.val().length) ||
        productUnitId.val() === null || (Array.isArray(productUnitId.val()) && !productUnitId.val().length) ||
        productWays.val() === null || (Array.isArray(productWays.val()) && !productWays.val().length) ||
        industrialUnitId.val() === null || (Array.isArray(industrialUnitId.val()) && !industrialUnitId.val().length)) {
        $.LoadingOverlay("hide");
        swal({
            title: "Заполните обязательные поля на 1-2 этапе и сохраните сделку!",
            icon: "info",
            button: "Ok"
        });

        return;
    }

    let closeDealDto = {
        closeDealId: id,
        closeDate: $('#closure-date-fail').val(),
        closeComment: $('#finish-comment').val()
    };

    $.ajax({
        type: "POST",
        url: `${api}/api/CloseDeal`,
        data: JSON.stringify(closeDealDto),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
            console.log("Deal was Closed");
            window.location.href = `/Deals/Deal/${data.id}`;
        },
        complete: function () {
            $.LoadingOverlay("hide");
        },
        error: function (data) {
            if (data.status === 403) {
                swal({
                    title: "У Вас нет доступа к данному действию!",
                    icon: "error",
                    button: "Ok"
                });
                return;
            } else {
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok"
                });
            }
        },
        dataType: 'JSON',
        xhrFields: {
            withCredentials: true
        }
    });
}

function reopenDeal() {
    var id = location.href.split('/')[location.href.split('/').length - 1];
    var href = location.href;

    $.LoadingOverlay("show");

    $.ajax({
        type: "POST",
        url: `${api}/api/ReopenDeal`,
        data: {
            putOffDealId: id,
            href: href
        },
        success: function (data) {
            console.log(data);
            console.log("Deal was Reopened");
            window.location.href = `/Deals/Deal/${data.id}`;
        },
        complete: function () {
            $.LoadingOverlay("hide");
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

var highlightRequiredElement = (element) => {
    getRequiredElementParent(element).addClass("required-field-group-highlighted");
};

var getRequiredElementParent = (element) => {
    return element.closest("div.form-group");
};

function closeDeal() {
    var isValid = true;
    $(`.finish-info select[required],
                .finish-info textarea[required]`).each(function () {
        const element = $(this);
        if ((element.val() === "" || element.val() === null
            || Array.isArray(element.val()) && !element.val().length) &&
            element.is(':visible')) {
                highlightRequiredElement(element);
                isValid = false;
        }
    });

    if (!isValid)
        return;

    let indDepartmentId = $('#verification-step-industrial-departments');
    let saleDepartmentId = $('#verification-step-sales-departments');
    let saleUnitId = $('#verification-step-sales-units');
    let productUnitId = $('#verification-step-product-units');
    let industrialUnitId = $('#verification-step-industrial-units');
    let productWays = $('#verification-step-product-line');

    if (indDepartmentId.val() === null || (Array.isArray(indDepartmentId.val()) && !indDepartmentId.val().length) ||
        saleDepartmentId.val() === null || (Array.isArray(saleDepartmentId.val()) && !saleDepartmentId.val().length) ||
        saleUnitId.val() === null || (Array.isArray(saleUnitId.val()) && !saleUnitId.val().length) ||
        productUnitId.val() === null || (Array.isArray(productUnitId.val()) && !productUnitId.val().length) ||
        productWays.val() === null || (Array.isArray(productWays.val()) && !productWays.val().length) ||
        industrialUnitId.val() === null || (Array.isArray(industrialUnitId.val()) && !industrialUnitId.val().length)) {
        swal({
            title: "Заполните обязательные поля на 1-2 этапе и сохраните сделку!",
            icon: "info",
            button: "Ok"
        });

        return;
    }
    let id = location.href.split('/')[location.href.split('/').length - 1];

    let closeDealDto = {
        closeDealId: id,
        closeDate: $('#closure-date-fail').val(),
        closeComment: $('#finish-comment').val()
    };

    $.LoadingOverlay("show");

    if (id !== "Deal" && closeDealDto.closeComment !== "") {
        
        $.ajax({
            type: "POST",
            url: `${api}/api/RequestToCloseDeal`,
            data: JSON.stringify(closeDealDto),
            contentType: "application/json",
            success: function (data) {
                window.location.href = `/Deals/Deal/${data.id}`;
            },
            complete: function () {
                $.LoadingOverlay("hide");
            },
            error: function (data) {
                if (data.status === 403) {
                    swal({
                        title: "У Вас нет доступа к данному действию!",
                        icon: "error",
                        button: "Ok"
                    }).then(() => {
                        window.location.href = location.origin;
                    });
                    return;
                } else {
                    swal({
                        title: "Неизвестная ошибка, обратитесь к администратору системы",
                        icon: "error",
                        button: "Ok"
                    });
                }
            },
            dataType: 'JSON',
            xhrFields: {
                withCredentials: true
            }
        });
    }
    else {
        $.ajax({
            type: "POST",
            url: `${api}/api/CloseDeal`,
            data: JSON.stringify(closeDealDto),
            contentType: "application/json",
            success: function (data) {
                console.log(data);
                console.log("Deal was Closed");
                window.location.href = `/Deals/Deal/${data.id}`;
            },
            complete: function () {
                $.LoadingOverlay("hide");
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
}

function putOffDeal() {
    var isValid = true;
    $(`.put-off-info input[required],
                .put-off-info textarea[required]`).each(function () {
        const element = $(this);
        if (element.val() === "") {
            highlightRequiredElement(element);
            isValid = false;
        }
    });

    if (!isValid)
        return;
    let data = {};
    data.putOffDate = $('#put-off-date').val();
    data.putOffComment = $('#put-off-comment').val();
    data.href = location.href;

    var id = location.href.split('/')[location.href.split('/').length - 1];

    if (id !== "Deal") {
        $.LoadingOverlay("show");
        $.ajax({
            type: "POST",
            url: `${api}/api/PutOffDeal`,
            data: {
                putOffDate: data.putOffDate,
                putOffComment: data.putOffComment,
                href: data.href,
                putOffDealId: id
            },
            success: function (data) {
                window.location.href = `/Deals/Deal/${data.id}`;
            },
            complete: function () {
                $.LoadingOverlay("hide");
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
}