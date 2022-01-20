function toogleLock(id, isLocked, element) {
    var toogleLockDto = {
        id: id,
        isLocked: isLocked
    };

    window.fetch(`${api}/api/MarketingList/UpdateLock/${id}`,
        {
            credentials: 'include',
            method: 'PUT',
            body: JSON.stringify(toogleLockDto),
            headers: new window.Headers({
                'Content-Type': 'application/json'
            })
        }).then(function (response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.text();
    }).then(function (response) {
        console.log("ok");

        if ($(element).hasClass('fa-unlock'))
            $(element).replaceWith(
                `<i class="fa fa-lock fa-2x text-danger" id="lock-${id}" onclick="toogleLock('${id
                }', false, this)" aria-hidden="true"></i>`);
        else
            $(element).replaceWith(
                `<i class="fa fa-unlock fa-2x text-success" id="lock-${id}" onclick="toogleLock('${id
                }', true, this)" aria-hidden="true"></i>`);
    }).catch(function (error) {
        console.log(error);
    });
}

function createMarketingList(element) {
    let name = $('#marketing-list-new-name').val().trim();

    if (name === "") {
        $('#marketing-list-new-name').addClass('is-invalid');
        return;
    }

    var marketingListCreateDto = {
        name: name
    };

    $('.btn').attr('disabled', true);
    $(element).html($(element).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    window.fetch(`${api}/api/MarketingList`,
        {
            credentials: 'include',
            method: 'POST',
            body: JSON.stringify(marketingListCreateDto),
            headers: new window.Headers({
                'Content-Type': 'application/json'
            })
        }).then(function (response) {
        if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        }).then(function (response) {
            swal({
                title: "Успешно сохранено!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                $(element).find('.fa').remove();
                $('.btn').attr('disabled', false);

                let link = location.origin + `/Campaigns/MailingList/${response.id}`;

                let $temp = $("<input>");
                $("body").append($temp);
                $temp.val(link).select();
                document.execCommand("copy");
                $temp.remove();

                window.location.href = `/Campaigns/MailingList/${response.id}`;
            });

        }).catch(function (error) {
            console.log(error);
    });
}

function deleteMarketingList(id, name) {

    if (confirm('Вы действительно хотите удалить список ' + name))
        window.fetch(`${api}/api/MarketingList/MakeInvisible/${id}`,
            {
                credentials: 'include',
                method: 'PUT',
                headers: new window.Headers({
                    'Content-Type': 'application/json'
                })
            }).then(function (response) {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.text();
            }).then(function (response) {
                window.marktingListTable
                    .row($('#delete-' + id).parents('tr'))
                    .remove()
                    .draw();
            }).catch(function (error) {
                console.log(error);
            });
}
