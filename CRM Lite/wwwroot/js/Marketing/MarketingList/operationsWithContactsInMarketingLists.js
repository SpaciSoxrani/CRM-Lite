function addContactToMarketingList(element) {
    let contactIds = [...window.contactObjects].map(contact => contact.id);
    let presentType = $('#present-type').val();
    let needToDeliver = $('#need-to-deliver').prop("checked");
    let address = $('#contact-delivery-address').val();
    let index = $('#contact-delivery-index').val();
    let phone = $('#contact-delivery-phone').val();
    let contactName = $('#contact-delivery-name').val();

    if (!presentType) {
        highlightRequiredElementBlock($('#present-type'));
        return;
    }

    let marketingListContactUpdateDto = {
        id: window.addedContactRow.data().id,
        presentId: presentType,
        needToDeliver: needToDeliver,
        address: address,
        index: index,
        phone: phone,
        contactName: contactName
    };

    let contactUpdateDto = {
        id: id,
        contactIds: contactIds
    };

    $('.btn').attr('disabled', true);
    $(element).html($(element).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");

    Promise.all([
        window.fetch(`${api}/api/MarketingList/UpdateContactIds/${id}`,
            {
                credentials: 'include',
                method: 'PUT',
                body: JSON.stringify(contactUpdateDto),
                headers: new window.Headers({
                    'Content-Type': 'application/json'
                })
            }),
        window.fetch(`${api}/api/Contacts/ChangeMarketingInfo/${marketingListContactUpdateDto.id}`,
            {
                credentials: 'include',
                method: 'PUT',
                body: JSON.stringify(marketingListContactUpdateDto),
                headers: new window.Headers({
                    'Content-Type': 'application/json'
                })
            })
    ]).then(([okMsg, contactInfo]) => {
        contactInfo.json().then((el) => {
            window.addedContactRow.data(el).draw();
            $(element).find('.fa').remove();
            $('.btn').attr('disabled', false);
            window.modalAddContactToMl.close();
            $('.alert-success').fadeIn(1500).fadeOut(1500);
        });
    }).catch((err) => {
        console.log(err);
    });
}

function deleteContactFromMarketingList() {
    let contactIds = [...window.contactObjects].map(contact => contact.id);

    let contactUpdateDto = {
        id: id,
        contactIds: contactIds
    };

    window.fetch(`${api}/api/MarketingList/UpdateContactIds/${id}`,
        {
            credentials: 'include',
            method: 'PUT',
            body: JSON.stringify(contactUpdateDto),
            headers: new window.Headers({
                'Content-Type': 'application/json'
            })
        }).then(function (response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response.text();
    }).then(function (response) {
        $('.alert-success').fadeIn(1500).fadeOut(1500);
    }).catch(function (error) {
        console.log(error);
    });
}

function rejectAddingContact() {
    window.contactObjects.delete(window.addedContactRow.data());
    window.addedContactRow.deselect();
    window.modalAddContactToMl.close();
}

function highlightRequiredElementBlock(element) {
    getRequiredElementParentBlock(element).addClass("required-field-group-highlighted");
}

function getRequiredElementParentBlock(element) {
    return element.siblings(".select2-container");
}