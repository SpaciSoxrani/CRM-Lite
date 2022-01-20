function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function sendTestEmail(el) {
    $('select, input').removeClass('is-invalid');
    $('.btn').attr('disabled', true);
    $(el).html($(el).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");
    let mjmlText = mjmlManager.deploy();
    let emailTheme = $('#email-theme').val().trim();

    if (emailTheme === "") {
        $('#email-theme').addClass('is-invalid');
        $(el).find('.fa').remove();
        $('.btn').attr('disabled', false);
        return;
    }

    fetch(`${api}/api/EmailTemplates/SendTestEmailWithMjml`,
        {
            method: "POST",
            credentials: 'include',
            body: JSON.stringify({
                mjmlText: mjmlText,
                emailTheme: emailTheme
            }),
            headers: {
                "Content-type": "application/json;"
            }
        }).then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' +
                    response.status);
                $(el).find('.fa').remove();
                $('.btn').attr('disabled', false);
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok"
                });
                return;
            }

            swal({
                title: "Успешно отправлено!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                $(el).find('.fa').remove();
                $('.btn').attr('disabled', false);
                modalSendEmail.close();
            });
        });
}

function sendEmail(el) {
    $('select, input').removeClass('is-invalid');
    $('.btn').attr('disabled', true);
    $(el).html($(el).text() + "<i class='fa fa-spinner fa-pulse fa-fw'></i>");
    let mjmlText = mjmlManager.deploy();
    let additionalReceiverEmails = $('.additional-receivers').val();
    let marketingListIds = $('.marketing-lists').val();
    let emailTheme = $('#email-theme').val().trim();

    if (emailTheme === "") {
        $('#email-theme').addClass('is-invalid');
        $(el).find('.fa').remove();
        $('.btn').attr('disabled', false);
        return;
    }

    if (!marketingListIds.length && !additionalReceiverEmails.length) {
        $('.additional-receivers').addClass('is-invalid');
        $('.marketing-lists').addClass('is-invalid');
        $(el).find('.fa').remove();
        $('.btn').attr('disabled', false);
        return;
    }

    fetch(`${api}/api/EmailTemplates/SendEmailWithMjml`,
        {
            method: "POST",
            credentials: 'include',
            body: JSON.stringify({
                mjmlText: mjmlText,
                additionalReceiverEmails: additionalReceiverEmails,
                marketingListIds: marketingListIds,
                emailTheme: emailTheme
            }),
            headers: {
                "Content-type": "application/json;"
            }
        })
        .then(response => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' +
                    response.status);

                $(el).find('.fa').remove();
                $('.btn').attr('disabled', false);
                swal({
                    title: "Неизвестная ошибка, обратитесь к администратору системы",
                    icon: "error",
                    button: "Ok"
                });
                return;
            }

            swal({
                title: "Успешно отправлено!",
                icon: "success",
                button: "Ok"
            }).then(() => {
                $(el).find('.fa').remove();
                $('.btn').attr('disabled', false);
                modalSendEmail.close();
            });
        });
}