var groupName = location.href.split('/')[location.href.split('/').length - 1];

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/Request")
    .build();

async function start() {
    try {
        await connection.start();
        console.log("connected");
        connection.invoke('Enter', groupName);
    } catch (err) {
        console.log(err);
        setTimeout(() => start(), 5000);
    }
};

connection.onclose(async () => {
    await start();
});

start();

GetMessagesFromDb(groupName);

connection.on('Send', (nick, message, photo, time) => {
    appendLine(nick, message, photo, time);
});

document.getElementById('btn-chat').addEventListener('click', event => {
    let message = $('#btn-input').val();
    let nick = user.fullName;

    $('#btn-input').val('');
    addMessageToDB(user.id, message, groupName);
    connection.invoke('Send', nick, message, user.photo, groupName);
    event.preventDefault();
});

document.getElementById('btn-chat').addEventListener('submit', event => {
    let message = $('#btn-input').val();
    let nick = user.fullName;

    $('#btn-input').val('');

    connection.invoke('Send', nick, message, user.photo, groupName);
    addMessageToDB(user.id, message, groupName);
    event.preventDefault();
});

function GetMessagesFromDb(requestId) {

    $.ajax({
        type: "GET",
        url: `${api}/api/Messages/Short/Request/${requestId}`,
        success: function (data) {
            $.each(data, function (idx, a) {
                appendLine(a.userName, a.text, a.photo, a.timeString);
            });
        },
        error: function (data) {
            console.error(data);
        },
        dataType: 'JSON'
    });
};

function addMessageToDB(userId, messageText, groupName) {
    let messageModel = {
        requestId: groupName,
        userId: userId,
        text: messageText
    };

    $.ajax({
        type: "POST",
        url: `${api}/api/Messages/Short`,
        data: JSON.stringify(messageModel),
        contentType: "application/json",
        error: function (data) {
            console.error(data);
        },
        dataType: 'JSON'
    });
}

function appendLine(nick, message, photo, time) {

    if (photo === "")
        photo = "/img/defaultAvatar.jpg";

    var placing = nick === user.fullName ? "left" : "right";
    var messagePlacing = nick === user.fullName ? "right" : "left";

    var messageElem = `<li class="${placing} clearfix">
                                <span class="chat-img pull-${placing}">
                                    <img src="${photo}" height="35" alt="User Avatar" class="img-circle">
                                </span>
                                <div class="chat-body clearfix">
                                    <div class="header">
                                        <strong class="primary-font">${nick}</strong> <small class="pull-${
        messagePlacing} text-muted">
                                            <span class="glyphicon glyphicon-time"></span>${time}
                                        </small>
                                    </div>
                                    <p>
                                        ${message}
                                    </p>
                                </div>
                            </li>`;

    $('.chat').append(messageElem);
};