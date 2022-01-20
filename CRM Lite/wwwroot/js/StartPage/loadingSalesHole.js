var salesUnits = "";
var firstSalesHoleLoad = true;

$(function () {
    loadSalesHoleInfo();
});

function thousandSeparator(str) {
    if ((str === "") || ((str === null)) || ((str === "0"))) return "";
    var parts = (str + '').split('.'),
        main = parts[0],
        len = main.length,
        output = '',
        i = len - 1;

    while (i >= 0) {
        output = main.charAt(i) + output;
        if ((len - i) % 3 === 0 && i > 0 && main.charAt(i - 1) !== '-') {
            output = ' ' + output;
        }
        --i;
    }
    if (parts.length > 1) {
        if (parts[1].length === 1) parts[1] += '0';
        output += ',' + parts[1] + " ₽";
    } else {
        output += " ₽";
    }
    return output;
}

function loadSalesHoleOfUnit(salesUnit, btn) {

    if ($(btn).hasClass('btn-outline-primary')) {
        $(btn).removeClass('btn-outline-primary');
        $(btn).addClass('btn-primary');
    } else {
        $(btn).removeClass('btn-primary');
        $(btn).addClass('btn-outline-primary');
    }

    if (salesUnits.includes(salesUnit))
        salesUnits = salesUnits.replace(salesUnit, "");
    else
        salesUnits += salesUnit;

    loadSalesHoleInfo();
}

function loadSalesHoleInfo() {
    if (!salesUnits)
        salesUnits = "";

    Promise.all([
        window.fetch(`${api}/api/Deals/GetSalesHole?isPlan=false&salesUnit=${salesUnits}`,
            {
                credentials: 'include'
            }),
        window.fetch(`${api}/api/Deals/GetSalesHole?isPlan=true&salesUnit=${salesUnits}`,
            {
                credentials: 'include'
            })
    ]).then(([generalSalesHoleJson, planSalesHoleJson]) => {
        let totalGeneralMoney = 0;
        let totalPlanMoney = 0;

        Promise.all([
            generalSalesHoleJson.json(),
            planSalesHoleJson.json()
        ]).then(([generalSalesHole, planSalesHole]) => {
            for (let el of generalSalesHole) {

                $(`.generalSalesHoleMoney[data-probability=${el.probability}]`)
                    .text(thousandSeparator(el.realMarginSum));
                totalGeneralMoney += el.realMarginSum;
            }

            for (let margingField of $(`.generalSalesHoleMoney`)) {
                if ($(margingField).text() === "")
                    $(margingField).text("0,00 ₽");
            }

            $('.totalGeneralSalesHoleMoney').text(`Всего: ${thousandSeparator(totalGeneralMoney.toFixed(0))}`);

            for (let el of planSalesHole) {

                $(`.planSalesHoleMoney[data-probability=${el.probability}]`).text(thousandSeparator(el.realMarginSum));
                totalPlanMoney += el.realMarginSum;
            }

            for (let margingField of $(`.planSalesHoleMoney`)) {
                if ($(margingField).text() === "")
                    $(margingField).text("0,00 ₽");
            }

            $('.totalPlanSalesHoleMoney').text(`Всего: ${thousandSeparator(totalPlanMoney.toFixed(0))}`);

            if (!totalGeneralMoney && !totalPlanMoney && firstSalesHoleLoad) {
                $('.sales-hole-block').hide();
                firstSalesHoleLoad = false;
                return;
            }

        });

        $(".loader-sales-hole").fadeOut(800, function () {
            $(".info-sales-hole").fadeIn(100);
        });
    }).catch((err) => {
        $(".loader-sales-hole").fadeOut(800, function () {
            $(".alert-sales-hole").fadeIn(100);
        });
    });
}