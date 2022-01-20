// VERIFICATION 1 STEP

var verificationSigningDatePicker = $('#verification-step-signing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },
});

var verificationSigningDateData = verificationSigningDatePicker.datepicker().data('datepicker');

// DEVELOPMENT 2 STEP

var developmentSigningDatePicker = $('#development-step-signing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,
    dateFormat: 'dd.mm.yyyy',
    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },
    onSelect: function (formattedDate, date, inst) {
        if (date === "")
            developmentClosingDateData.update('minDate', '');
        else
            developmentClosingDateData.update('minDate', date);
    }
});

var developmentSigningDateData = developmentSigningDatePicker.datepicker().data('datepicker');

var developmentClosingDatePicker = $('#development-step-closing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function(inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },
    onSelect: function(formattedDate, date, inst) {
        if (date === "") {
            developmentSigningDateData.update('maxDate', '');
            verificationSigningDateData.update('maxDate', '');
        } else {
            developmentSigningDateData.update('maxDate', date);
            verificationSigningDateData.update('maxDate', date);
        }
    }
});

var developmentClosingDateData = developmentClosingDatePicker.datepicker().data('datepicker');

// NEGOTIATING 3 STEP

var negotiateSigningDatePicker = $('#hint-negotiating-step-signing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "")
            negotiateClosingDateData.update('minDate', '');
        else
            negotiateClosingDateData.update('minDate', date);
    }
});

var negotiateSigningDateData = negotiateSigningDatePicker.datepicker().data('datepicker');

var negotiateClosingDatePicker = $('#hint-negotiating-step-closing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "") {
            negotiateSigningDateData.update('maxDate', '');
            verificationSigningDateData.update('maxDate', '');
            developmentSigningDateData.update('maxDate', '');
        } else {
            negotiateSigningDateData.update('maxDate', date);
            verificationSigningDateData.update('maxDate', date);
            developmentSigningDateData.update('maxDate', date);
        }
    }
});

var negotiateClosingDateData = negotiateClosingDatePicker.datepicker().data('datepicker');

// CONTEST 4 STEP

var contestProcurementDatePicker = $('#hint-contest-step-procurement-procedure-results-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "") {
            contestSigningDateData.update('minDate', '');
            verificationSigningDateData.update('minDate', '');
            developmentSigningDateData.update('minDate', '');
            contestClosingDateData.update('minDate', '');
        } else {
            contestSigningDateData.update('minDate', date);
            verificationSigningDateData.update('minDate', date);
            developmentSigningDateData.update('minDate', date);
            contestClosingDateData.update('minDate', date);
        }
    }
});

var contestProcurementDateData = contestProcurementDatePicker.datepicker().data('datepicker');

var contestSigningDatePicker = $('#hint-contest-step-signing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "") {
            contestClosingDateData.update('minDate', '');
            contestProcurementDateData.update('maxDate', '');
        } else {
            contestClosingDateData.update('minDate', date);
            if (contestClosingDateData.selectedDates[0] === undefined)
                contestProcurementDateData.update('maxDate', date);
            else
                contestProcurementDateData.update('maxDate', contestClosingDateData.selectedDates[0]);
        }
    }
});

var contestSigningDateData = contestSigningDatePicker.datepicker().data('datepicker');

var contestClosingDatePicker = $('#hint-contest-step-closing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "") {
            if (contestSigningDateData.selectedDates[0] === undefined) {
                contestProcurementDateData.update('maxDate', '');
                contestSigningDateData.update('maxDate', '');
            } else {
                contestProcurementDateData.update('maxDate', contestSigningDateData.selectedDates[0]);
            }
        } else {
            contestProcurementDateData.update('maxDate', date);
            contestSigningDateData.update('maxDate', date);
        }
    }
});

var contestClosingDateData = contestClosingDatePicker.datepicker().data('datepicker');

// CONTRACT SIGNED 5 STEP

var contractSigningDatePicker = $('#hint-contract-signed-step-signing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "") 
            contractClosingDateData.update('minDate', '');
        else 
            contractClosingDateData.update('minDate', date);
        
    }
});

var contractSigningDateData = contractSigningDatePicker.datepicker().data('datepicker');

var contractClosingDatePicker = $('#hint-contract-signed-step-closing-date').datepicker({
    todayButton: new Date(),
    autoClose: true,

    onShow: function (inst, animationCompleted) {
        $('div.datepicker--cell.datepicker--cell-day.-disabled-').click(function () {
            swal({
                title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                icon: "info",
                button: "Ok"
            });
        });
    },

    onSelect: function (formattedDate, date, inst) {
        if (date === "") 
            contractSigningDateData.update('maxDate', '');
        else 
            contractSigningDateData.update('maxDate', date);
        
    }
});

var contractClosingDateData = contractClosingDatePicker.datepicker().data('datepicker');

// BLOCK TEXT INPUT AND AUTOCOMPLETE

$('.datepicker-here').each(function () {
    var datepicker = $(this).datepicker().data('datepicker');

    $(this).attr('maxlength', 10);

    $(this).on('keyup', function (e) {
        var dateArr = $(this).val().split('.');

        e.target.value = this.value.replace(/[^\d\.\/]/g, '');

        e.target.value = this.value.replace(/[\/]/g, '.');

        if ((e.target.value.length === 2 || e.target.value.length === 5) && e.keyCode !== 8)
            e.target.value += '.';

        if (dateArr.length !== 3) {
            return;
        }

        if (dateArr[0] > 0 && dateArr[0] < 32 && dateArr[1] > 0 && dateArr[1] < 13 && dateArr[2].length === 4) {
            var date = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);

            if (date >= datepicker.minDate && date <= datepicker.maxDate) {
                datepicker.date = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);
                datepicker.selectDate(new Date(dateArr[2], dateArr[1] - 1, dateArr[0]));

                datepicker.selectedDates[0] = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);
            } else {
                e.target.value = '';

                swal({
                    title: "Дата подписания контракта не может быть позже Даты закрытия контракта!",
                    icon: "info",
                    button: "Ok"
                });
            }
        }

    });

    $(this).on("focusout", function () {
        var dateValue = $(this).val();

        if (dateValue.length !== 10) {
            $(this).val('');
            return;
        }

        var dateArr = dateValue.split('.');

        if (!(dateArr[0] > 0 && dateArr[0] < 32 && dateArr[1] > 0 && dateArr[1] < 13 && dateArr[2].length === 4)) {
            $(this).val('');
            return;
        }
    });


    $(this).attr("autocomplete", "off");
});