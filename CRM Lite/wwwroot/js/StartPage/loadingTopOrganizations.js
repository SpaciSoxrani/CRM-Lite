var firstTopOrgLoad = true;

$(function () {
    var count = isTop ? "?count=30" : "";
     window.fetch(`${api}/api/Organizations/GetTopOrganizations${count}`,
        {
            credentials: 'include'
        }).then(response => {
            if (response.status !== 200) {
                $(".loader-top-organizations").fadeOut(800, function () {
                    $(".alert-top-organizations").fadeIn(100);
                });

                return [];
            }

            return response.json();
        })
         .then(topOrganizationDtos => {
             let expertMarginSum = 0;

             if (firstTopOrgLoad && !topOrganizationDtos.length) {
                 $('.top-organizations-block').hide();
                 firstTopOrgLoad = false;
                 return;
             }

            for (let i = 0; i < topOrganizationDtos.length; i++) {
                $('.table-top-organizations tbody').append(`<tr onclick="window.open('/Organizations/Organization/${topOrganizationDtos[i].organizationId}')">
                                <td>${i + 1}.</td>
                                <td>${topOrganizationDtos[i].organizationName}</td>
                                <td>${thousandSeparator(topOrganizationDtos[i].organizationExpertMargin.toFixed(0))}</td>
                                <td>${topOrganizationDtos[i].organizationResponsibleName}</td>
                            </tr>`);

                expertMarginSum += topOrganizationDtos[i].organizationExpertMargin;
            }

            $("#total-margin-top-organizations").text(thousandSeparator(expertMarginSum.toFixed(0)));

            $('.table-top-organizations').on('click',
                'tbody tr',
                function (e) {
                    if (!$(e.target).hasClass('remove'))
                        window.open(`/Contacts/Contact/${(table.row(this).data()).id}`, '_blank');
                });

            $('.table-top-organizations tbody').hover(function () {
                $(this).css('cursor', 'pointer');
            });

            $(".loader-top-organizations").fadeOut(800, function () {
                $(".table-top-organizations").fadeIn(100);
                $(".total-margin-block-top-organizations").fadeIn(100);
            });
        });
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