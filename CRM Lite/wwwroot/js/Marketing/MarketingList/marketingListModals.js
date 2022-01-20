$(function() {
    let newListModal = new RModal(document.getElementById('modal-new-marketing-list'), {

        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        newListModal.keydown(ev);
    }, false);

    window.modalNewMarketingList = newListModal;

    let addContactModal = new RModal(document.getElementById('modal-add-contact-to-marketinglist'), {

        beforeOpen: function (next) {
            let contactId = window.addedContactRow.data().id;
            window.fetch(`${api}/api/Contacts/DeliveryInfo/${contactId}`,
                {
                    credentials: 'include',
                    method: 'GET'
                }).then(function (response) {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.json();
            }).then(function (deliveryInfo) {
                $('#present-type').val(deliveryInfo.presentId).change();
                $('#need-to-deliver').prop('checked', deliveryInfo.isNeedToDeliver);
                $('#contact-delivery-address').val(deliveryInfo.deliverAddress);
                $('#contact-delivery-index').val(deliveryInfo.deliverIndex);
                $('#contact-delivery-phone').val(deliveryInfo.deliverPhoneNumber);
                $('#contact-delivery-name').val(deliveryInfo.deliverContactName);

                if (deliveryInfo.isNeedToDeliver) {
                    $('#delivery-block').css('display', 'block');
                }

                $('#need-to-deliver').on('change',
                    () => {
                        let isNeedToDeliver = $('#need-to-deliver').prop("checked");

                        if (isNeedToDeliver) 
                            $('#delivery-block').fadeIn('slow', () => { });
                        else
                            $('#delivery-block').fadeOut('slow', () => { });
                        
                    });

                next();
            }).catch(function (error) {
                console.log(error);
            });
        }

        , beforeClose: function (next) {
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        addContactModal.keydown(ev);
    }, false);

    window.modalAddContactToMl = addContactModal;
});