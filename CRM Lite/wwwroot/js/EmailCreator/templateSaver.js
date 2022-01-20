function SaveTemplate(element, fromOtherTemplate = false) {
    let name = "";

    if (fromOtherTemplate) {
        name = $('#template-name').val().trim();

        if (name === "") {
            $('#template-name').addClass('is-invalid');
            return;
        }
    } else {
        name = $('#template-new-name').val().trim();

        if (name === "") {
            $('#template-new-name').addClass('is-invalid');
            return;
        }
    }

    

    let htmlTemplate = $('#drop-zone').html();
    let elements = [];

    for (let element of window.mjmlManager.mjmlElementsMap.entries()) 
        elements.push({
            name: element[0],
            propsJson: JSON.stringify(element[1].props),
            insideMjmlIds: JSON.stringify(element[1].insideMjmlIds)
        });

    var marketingEmailTemplateDto = {
        name: name,
        htmlTemplate: htmlTemplate,
        elements: elements,
        counter: window.mjmlManager.elementIdCounter
    };

    $('.btn').attr('disabled', true);
    $(element).html($(element).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    window.fetch(`${api}/api/EmailTemplates/SaveEmailTemplate`,
        {
            credentials: 'include',
            method: 'POST',
            body: JSON.stringify(marketingEmailTemplateDto),
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

            window.location.href = `/Campaigns/EmailTemplate/${response.id}`;
        });

    }).catch(function (error) {
        console.log(error);
    });
}