var cloudLinks = new Map();

var getAllCloudLinks = () => {

    var linkObjects = [];
    var dealId = location.href.split('/')[location.href.split('/').length - 1];

    if (dealId === "Deal")
        dealId = null;

    cloudLinks.forEach((value, key) => {
        linkObjects.push({
            linkName: key,
            dealId: dealId,
            link: value,
            authorId: user.id
        });
    });

    return linkObjects;
};

function InsertCloudLinks (links) {
    links.forEach(function (item, i, arr) {
        cloudLinks.set(item.linkName, item.link);
    });
}

var checkСloudLink = (el) => {
    if (!el.value.includes("https://cloud.hostco.ru")) {
        if (el.value === "") {
            cloudLinks.delete(el.id);
            return;
        }

        $(el).val("");

        $(el).tooltip({
            trigger: "manual"
        });

        $(el).tooltip('toggle');
        setTimeout(function() {
                $(el).tooltip('toggle');
            },
            2000);
    } else {
        cloudLinks.set(el.id, el.value);
    }
};

function enableCloudLinks() {

    $('.popover-cloud').popover({
        html: true,
        container: "body",
        sanitize: false,
        trigger: "click",
        content: function () {
            var elementId = $(this).attr("data-popover-content");
            return $(elementId).html();
        }
    });

    $('.popover-cloud').on('inserted.bs.popover',
        function() {
            var elementId = $(this).attr("aria-describedby");
            var input = $('#' + elementId).children('.popover-body').find('input');
            input.val(cloudLinks.get(input.attr("id")));
        });

    $('body').on('click', function (e) {
        $('[data-toggle=popover]').each(function () {
            // hide any open popovers when the anywhere else in the body is clicked
            if ((!$(this).is(e.target) &&
                $(this).has(e.target).length === 0 &&
                $('.popover').has(e.target).length === 0) ||
                $(e.target).hasClass('fa-check') || $(e.target).hasClass('save-cloud-link')) {
                $(this).popover('hide');
            }
        });
    });
}