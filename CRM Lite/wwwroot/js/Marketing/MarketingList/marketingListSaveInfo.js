function saveMarketingListName(saveButton) {
    let name = $('#marketing-list-name').val().trim();

    if (name === "") {
        $('#marketing-list-name').addClass("is-invalid");
        return;
    }

    if (saveButton) {
        saveButton.attr('disabled', true);
        saveButton.find('.fa').replaceWith("<i class='fa fa-spinner fa-pulse fa-fw'></i>");
    }

    let updateNameDto = {
        id: id,
        name: name
    };

    window.fetch(`${api}/api/MarketingList/UpdateName/${id}`,
        {
            credentials: 'include',
            method: 'PUT',
            body: JSON.stringify(updateNameDto),
            headers: new window.Headers({
                'Content-Type': 'application/json'
            })
        }).then(function (response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.text();
    }).then(function (response) {
        if (saveButton) {
            saveButton.attr('disabled', false);
            
            saveButton.fadeOut("slow", function () {
                saveButton.find('.fa').replaceWith('<i class="fa fa-check" aria-hidden="true"></i>');
            });
        }

    }).catch(function (error) {
        console.log(error);
    });
}