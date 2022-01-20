$(document).ready(function () {
    $('.setting').click(function (e) {

        SendEmailSettings();
    });
});

var SendEmailSettings = () => {

    var emailSettingsModal = {};

    emailSettingsModal.id = $('#userSettingsEmail').val();

    emailSettingsModal.userId = user.id;

    emailSettingsModal.isReceiveEmailAboutStartingProductRequest = $('#isReceiveEmailAboutStartingProductRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutAppointingMpAtProductRequest = $('#isReceiveEmailAboutAppointingMpAtProductRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutAcceptingProductRequest = $('#isReceiveEmailAboutAcceptingProductRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutFinishingProductRequest = $('#isReceiveEmailAboutAcceptingProductRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutStartingServiceRequest = $('#isReceiveEmailAboutStartingServiceRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutAnswerOnServiceRequest = $('#isReceiveEmailAboutAnswerOnServiceRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutFinishServiceRequest = $('#isReceiveEmailAboutFinishServiceRequest').prop("checked");

    emailSettingsModal.isReceiveEmailAboutPutOffDeal = $('#isReceiveEmailAboutPutOffDeal').prop("checked");

    emailSettingsModal.isReceiveEmailAboutReopenDeal = $('#isReceiveEmailAboutReopenDeal').prop("checked");

    emailSettingsModal.isReceiveEmailAboutRequestToCloseDeal = $('#isReceiveEmailAboutRequestToCloseDeal').prop("checked");

    emailSettingsModal.isReceiveEmailAboutClosingDeal = $('#isReceiveEmailAboutClosingDeal').prop("checked");

    $.ajax({
        type: 'PUT',
        url: `${api}/api/UserSettings/EmailSettings`,
        data: JSON.stringify(emailSettingsModal),
        contentType: "application/json",
        success: function (data) {
            console.info("Настройки обновлены");
        },
        error: function(err) {
            console.error(err);
        }
    });
};