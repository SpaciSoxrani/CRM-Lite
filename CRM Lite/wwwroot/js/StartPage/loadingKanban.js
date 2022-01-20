var kanbanSalesUnits = "";
var firstKanbanLoad = true;

$(function () {
    loadKanbanInfo();
});

function loadKanbanOfUnit(salesUnit, btn) {

    if ($(btn).hasClass('btn-outline-primary')) {
        $(btn).removeClass('btn-outline-primary');
        $(btn).addClass('btn-primary');
    } else {
        $(btn).removeClass('btn-primary');
        $(btn).addClass('btn-outline-primary');
    }

    if (kanbanSalesUnits.includes(salesUnit))
        kanbanSalesUnits = kanbanSalesUnits.replace(salesUnit, "");
    else
        kanbanSalesUnits += salesUnit;

    loadKanbanInfo();
}

function loadKanbanInfo() {
    if (!kanbanSalesUnits)
        kanbanSalesUnits = "";

    window.fetch(`${api}/api/Deals/GetStartPageKanbanDeals?salesUnit=${kanbanSalesUnits}`,
        {
            credentials: 'include'
        }).then(response => {
            if (response.status !== 200) {
                $(".loader-kanban").fadeOut(800, function () {
                    $(".alert-kanban").fadeIn(100);
                });

                return [];
            }

            return response.json();
        })
        .then(deals => {
            $('.table-kanban tbody').html("");

            if (firstKanbanLoad && !deals.length) {
                $('.kanban-block').hide();
                firstKanbanLoad = false;
                return;
            }

            for (let i = 0; i < deals.length; i++) {
                $('.table-kanban tbody').append(`<tr>
                                    <td>${deals[i].saleName}</td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=1&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].verificationDealsCount}</a></td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=2&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].developmentDealsCount}</a></td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=3&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].negotiatingDealsCount}</a></td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=4&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].contestDealsCount}</a></td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=5&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].signDealsCount}</a></td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=6&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].workDealsCount}</a></td>
                                    <td><a href="/Deals/List?salesId=${deals[i].saleId}&stepNumber=7&isProduct=${deals[i].isProduct}&isLogistics=${deals[i].isLogistics}" target="_blank" class="font-weight-bold">${deals[i].closedDealsCount}</a></td>
                                </tr>`);
            }

            $('.table-kanban').on('click',
                'tbody tr',
                function (e) {
                    if (!$(e.target).hasClass('remove'))
                        window.open(`/Contacts/Contact/${(table.row(this).data()).id}`, '_blank');
                });

            $('.table-kanban tbody').hover(function () {
                $(this).css('cursor', 'pointer');
            });

            $(".loader-kanban").fadeOut(800, function () {
                $(".info-kanban").fadeIn(100);
            });
        });
}