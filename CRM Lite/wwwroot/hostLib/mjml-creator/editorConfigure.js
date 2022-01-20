function configureEditorForText(selector) {
    window.InitPopOverForText(selector);
}

function configureEditorForButton(selector) {
    window.InitPopOverForButton(selector);
}

function setElementItalic(selector) {
    document.execCommand('italic', false, null);

    let style = window.mjmlManager.getPropValue(selector, "font-style");

    if (style === "normal")
        window.mjmlManager.changePropValue(selector, 'font-style', "italic");
    else
        window.mjmlManager.changePropValue(selector, 'font-style', "normal");
}

function setElementBold(selector) {
    document.execCommand('bold', false, null);

    let style = window.mjmlManager.getPropValue(selector, "font-weight");

    if (style === "normal")
        window.mjmlManager.changePropValue(selector, 'font-weight', "bold");
    else
        window.mjmlManager.changePropValue(selector, 'font-weight', "normal");
}

function setElementLined(selector) {
    let underlinedTeg = $(`#${selector}`).find("u");
    if (underlinedTeg[0]) {
        document.execCommand('underline', false, null);
    }

    document.execCommand('strikethrough', false, null);

    let style = window.mjmlManager.getPropValue(selector, "text-decoration");

    if (style === "none" || style === "underline")
        window.mjmlManager.changePropValue(selector, 'text-decoration', "line-through");
    else
        window.mjmlManager.changePropValue(selector, 'text-decoration', "none");
}

function setElementUnderLined(selector) {
    let underlinedTeg = $(`#${selector}`).find("strike");
    if (underlinedTeg[0]) {
        document.execCommand('strikethrough', false, null);
    }

    document.execCommand('underline', false, null);

    let style = window.mjmlManager.getPropValue(selector, "text-decoration");

    if (style === "none" || style === "line-through")
        window.mjmlManager.changePropValue(selector, 'text-decoration', "underline");
    else
        window.mjmlManager.changePropValue(selector, 'text-decoration', "none");
}

function renameButton(el) {
    var div = $(el).find('.editable-element');

    div[0].setAttribute("contenteditable", true);
}

function setHref(selector, element) {
    let href = $(element).val();
    if (href) 
        window.mjmlManager.changePropValue(selector, 'href', href);
}

function chooseTextColor(selector) {
    let mycolor = document.getElementById("myColor" + selector).value;

    document.execCommand('foreColor', false, mycolor);
    window.mjmlManager.changePropValue(selector, 'color', mycolor);
}

function selectedText() {
    if (document.getSelection) {
        return document.getSelection();
    }
    else if (document.selection) {
        return document.selection.createRange().text;
    }

    return "";
}

function changeTextAlign(textFontCommand, selector, align) {
    document.execCommand(textFontCommand, false, null);
    window.mjmlManager.changePropValue(selector, 'align', align);
}

function chooseColumnOrBlockColor(selector, element) {
    let mycolor = $(element).val();
    $(`#${selector}`).css('background-color', mycolor);
    window.mjmlManager.changePropValue(selector, 'background-color', mycolor);
}

function changePadding(selector, element, direction) {
    let padding = $(element).val() + "px";
    $(`#${selector}`).css(`padding-${direction}`, padding);
    window.mjmlManager.changePropValue(selector, `padding-${direction}`, padding);
}

function changeButtonAlign(selector, direction) {
    if (direction === "center") {
        $(`#${selector}`).removeClass('mr-auto');
        $(`#${selector}`).removeClass('ml-auto');
        $(`#${selector}`).addClass('mx-auto');
        window.mjmlManager.changePropValue(selector, `align`, direction);
    }
    if (direction === "left") {
        $(`#${selector}`).removeClass('mx-auto');
        $(`#${selector}`).removeClass('ml-auto');
        $(`#${selector}`).addClass('mr-auto');
        window.mjmlManager.changePropValue(selector, `align`, direction);
    }
    if (direction === "right") {
        $(`#${selector}`).removeClass('mr-auto');
        $(`#${selector}`).removeClass('mx-auto');
        $(`#${selector}`).addClass('ml-auto');
        window.mjmlManager.changePropValue(selector, `align`, direction);
    }
}

function chooseButtonColor(selector, element) {
    let mycolor = document.getElementById("myBtnColor" + selector).value;
    var containerEditor = $(element).closest('.editorcontainer');
    if (containerEditor[0]) {
        let buttonSelector = containerEditor[0].dataset.textSelector;
        $('#' + buttonSelector).css('background-color', mycolor);
        window.mjmlManager.changePropValue(selector, 'background-color', mycolor);
    }
}

function changeFont(selector) {
    let myFont = document.getElementById("input-font" + selector).value;
    document.execCommand('fontName', false, myFont);

    window.mjmlManager.changePropValue(selector, `font-family`, myFont);
    
}

function changeSize(selector) {
    let mysize = document.getElementById("fontSize" + selector).value;
    $(`#${selector}`).css('font-size', mysize);
    window.mjmlManager.changePropValue(selector, `font-size`, mysize);
}
