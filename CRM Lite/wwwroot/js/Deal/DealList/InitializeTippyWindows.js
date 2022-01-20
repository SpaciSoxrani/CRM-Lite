var expectedMarginFromVal;
var expectedMarginToVal;
var expertMarginFromVal;
var expertMarginToVal;

var InitTippyWindows = () => {

    $('.tippy-block').removeClass('d-none');

    if (isTop) {
        var departmentDiv = document.getElementById('department-block');

        window.tippy('#department-button',
            {
                content: departmentDiv,
                allowHTML: true,
                trigger: 'click',
                interactive: true,
                placement: 'bottom'
            });
    }

    var expectedMarginDiv = document.getElementById('expected-margin-block');

    var cookieExpectedMarginFromVal;
    if (window.Cookies.get('expected-margin-from')) {

        cookieExpectedMarginFromVal = Number(window.Cookies.get('expected-margin-from'));

        if (cookieExpectedMarginFromVal !== 0) {
            window.editFilterFunction('expected-margin-from',
                (deal) => window.getNumberFromCurrency(deal.estimatedMargin) >= cookieExpectedMarginFromVal);

            $('#expected-margin-from').val(window.thousandSeparator(cookieExpectedMarginFromVal));

            $('#expected-margin-button').text(`От ${window.thousandSeparator(cookieExpectedMarginFromVal)}`);
        } else
            window.removeFilter('expected-margin-from');
    }

    if (window.Cookies.get('expected-margin-to')) {

        var cookieExpectedMarginToVal = Number(window.Cookies.get('expected-margin-to'));

        if (cookieExpectedMarginToVal !== 0) {
            window.editFilterFunction('expected-margin-to',
                (deal) => window.getNumberFromCurrency(deal.estimatedMargin) <= cookieExpectedMarginToVal);

            $('#expected-margin-to').val(window.thousandSeparator(cookieExpectedMarginToVal));

            if (cookieExpectedMarginFromVal !== undefined && cookieExpectedMarginFromVal !== 0)
                $('#expected-margin-button').text(`${window.thousandSeparator(cookieExpectedMarginFromVal)} - ${window.thousandSeparator(cookieExpectedMarginToVal)}`);
            else
                $('#expected-margin-button').text(`До ${window.thousandSeparator(cookieExpectedMarginToVal)}`);
        } else
            window.removeFilter('expected-margin-to');
    }

    window.tippy('#expected-margin-button', {
        content: expectedMarginDiv,
        allowHTML: true,
        trigger: 'click',
        interactive: true,
        placement: 'bottom',

        onHide(instance) {
            var expectedMarginFrom = window.getNumberFromCurrency($('#expected-margin-from').val());
            var expectedMarginTo = window.getNumberFromCurrency($('#expected-margin-to').val());

            if (expectedMarginFrom !== 0) {
                expectedMarginFromVal = expectedMarginFrom;

                window.Cookies.remove('expected-margin-from');
                window.Cookies.set('expected-margin-from', expectedMarginFrom, { expires: 60 });

                window.editFilterFunction('expected-margin-from',
                    (deal) => window.getNumberFromCurrency(deal.estimatedMargin) >= expectedMarginFromVal);

                $('#expected-margin-button').text(`От ${window.thousandSeparator(expectedMarginFrom)}`);

            } else {
                window.Cookies.remove('expected-margin-from');
                window.removeFilter('expected-margin-from');

                if (expectedMarginTo === 0)
                    $('#expected-margin-button').text(`Предполагаемая маржа`);
            }

            if (expectedMarginTo !== 0) {
                expectedMarginToVal = expectedMarginTo;

                window.Cookies.remove('expected-margin-to');
                window.Cookies.set('expected-margin-to', expectedMarginTo, { expires: 60 });

                window.editFilterFunction('expected-margin-to',
                    (deal) => window.getNumberFromCurrency(deal.estimatedMargin) <= expectedMarginToVal);

                if (expectedMarginFrom !== 0)
                    $('#expected-margin-button').text(`${window.thousandSeparator(expectedMarginFrom)} - ${window.thousandSeparator(expectedMarginTo)}`);
                else
                    $('#expected-margin-button').text(`До ${window.thousandSeparator(expectedMarginTo)}`);

            } else {
                window.Cookies.remove('expected-margin-to');
                window.removeFilter('expected-margin-to');
                if (expectedMarginFrom !== 0)
                    $(filterElementsMap.get('expected-margin-to')).addClass('checked-filter');
            }

            window.filterDeals();
        }
    });

    var expertMarginDiv = document.getElementById('expert-margin-block');

    var cookieExpertMarginFromVal;
    if (window.Cookies.get('expert-margin-from')) {

        cookieExpertMarginFromVal = Number(window.Cookies.get('expert-margin-from'));

        if (cookieExpertMarginFromVal !== 0) {
            window.editFilterFunction('expert-margin-from',
                (deal) => deal.expertMargin >= cookieExpertMarginFromVal);

            $('#expert-margin-from').val(window.thousandSeparator(cookieExpertMarginFromVal));

            $('#expert-margin-button').text(`От ${window.thousandSeparator(cookieExpertMarginFromVal)}`);
        } else
            window.removeFilter('expert-margin-from');
    }

    if (window.Cookies.get('expert-margin-to')) {

        var cookieExpertMarginToVal = Number(window.Cookies.get('expert-margin-to'));

        if (cookieExpertMarginToVal !== 0) {
            window.editFilterFunction('expert-margin-to',
                (deal) => deal.expertMargin <= cookieExpertMarginToVal);

            $('#expert-margin-to').val(window.thousandSeparator(cookieExpertMarginToVal));

            if (cookieExpertMarginFromVal !== undefined && cookieExpertMarginFromVal !== 0)
                $('#expert-margin-button').text(`${window.thousandSeparator(cookieExpertMarginFromVal)} - ${window.thousandSeparator(cookieExpertMarginToVal)}`);
            else
                $('#expert-margin-button').text(`До ${window.thousandSeparator(cookieExpertMarginToVal)}`);
        } else
            window.removeFilter('expert-margin-to');
    }

    window.tippy('#expert-margin-button', {
        content: expertMarginDiv,
        allowHTML: true,
        trigger: 'click',
        interactive: true,
        placement: 'bottom',

        onHide(instance) {
            var expertMarginFrom = window.getNumberFromCurrency($('#expert-margin-from').val());
            var expertMarginTo = window.getNumberFromCurrency($('#expert-margin-to').val());

            if (expertMarginFrom !== 0) {
                expertMarginFromVal = expertMarginFrom;

                window.Cookies.remove('expert-margin-from');
                window.Cookies.set('expert-margin-from', expertMarginFrom, { expires: 60 });

                window.editFilterFunction('expert-margin-from',
                    (deal) => deal.expertMargin >= expertMarginFromVal);

                $('#expert-margin-button').text(`От ${window.thousandSeparator(expertMarginFrom)}`);
            } else {
                window.Cookies.remove('expert-margin-from');
                window.removeFilter('expert-margin-from');

                if (expertMarginTo === 0)
                    $('#expert-margin-button').text(`Экспертная маржа`);
            }

            if (expertMarginTo !== 0) {
                expertMarginToVal = expertMarginTo;

                window.Cookies.remove('expert-margin-to');
                window.Cookies.set('expert-margin-to', expertMarginTo, { expires: 60 });

                window.editFilterFunction('expert-margin-to',
                    (deal) => deal.expertMargin <= expertMarginToVal);

                if (expertMarginFrom !== 0)
                    $('#expert-margin-button').text(`${window.thousandSeparator(expertMarginFrom)} - ${window.thousandSeparator(expertMarginTo)}`);
                else
                    $('#expert-margin-button').text(`До ${window.thousandSeparator(expertMarginTo)}`);
            } else {
                window.Cookies.remove('expert-margin-to');
                window.removeFilter('expert-margin-to');

                if (expertMarginFrom !== 0)
                    $(filterElementsMap.get('expert-margin-to')).addClass('checked-filter');
            }

            window.filterDeals();
        }
    });

    window.filterDeals();
};