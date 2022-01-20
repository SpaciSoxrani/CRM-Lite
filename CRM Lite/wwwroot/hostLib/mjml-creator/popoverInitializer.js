function InitPopOverForText(selector) {
    $('#' + selector).popover({
        trigger: 'manual',
        html: true,
        container: "body",
        sanitize: false,
        placement: 'top',
        offset: 10,
        content: function () {
            return `<div class="editorcontainer" data-text-selector="${selector}">
      <button class="fontStyle italic" onclick="setElementItalic('${selector}');" title="Italicize Highlighted Text"></button>
      <button class="fontStyle bold" onclick="setElementBold('${selector}');" title="Bold Highlighted Text"></button>
      <button class="fontStyle underline" onclick="setElementUnderLined('${selector}');"></button>
      <select id="input-font${selector}" class="input"  onchange="changeFont('${selector}');">
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Sans serif">Sans serif</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="Georgia">Georgia</option>
        <option value="Palatino">Palatino</option>
        <option value="Garamond">Garamond</option>
        <option value="Comic Sans MS">Comic Sans MS</option>
        <option value="Arial Black">Arial Black</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Comic Sans MS">Comic Sans MS</option>
      </select>
      <button class="fontStyle strikethrough" onclick="setElementLined('${selector}');"><strikethrough></strikethrough></button>
      <button class="fontStyle align-left" onclick="changeTextAlign('justifyLeft', '${selector}', 'left');"><justifyLeft></justifyLeft></button>
      <button class="fontStyle align-center" onclick="changeTextAlign('justifyCenter', '${selector}', 'center');"><justifyCenter></justifyCenter></button>
      <button class="fontStyle align-right" onclick="changeTextAlign('justifyRight', '${selector}', 'right');"><justifyRight></justifyRight></button>   
      <input class="color-apply" type="color" onchange="chooseTextColor('${selector}')" id="myColor${selector}"> 

      <!-- font size start -->
      <select id="fontSize${selector}" onclick="changeSize('${selector}', this)">
        <option value="10px">1</option>      
        <option value="12px">2</option>
        <option value="14px">3</option>
        <option value="18px">4</option>
        <option value="20px">5</option>
        <option value="25px">6</option>
        <option value="28px">7</option>
        <option value="32px">8</option>
      </select>
      <!-- font size end -->
      <div>
<span><i class="fa fa-trash" aria-hidden="true" onclick="if(confirm(\'Вы действительно хотите удалить элемент\')){ $('#${selector}').popover('hide'); window.mjmlManager.deleteMjmlElement('${selector}', true); }"></i> </span>
</div>
  </div>`;
        }
    });
}

function InitPopOverForButton(selector) {
    let hrefValue = mjmlManager.mjmlElementsMap.get(selector).props["href"];
    if (!hrefValue)
        hrefValue = "";

    $('#' + selector).popover({
        trigger: 'manual',
        html: true,
        container: "body",
        sanitize: false,
        placement: "top",
        offset: 10,
        content: function () {
            return `<div class="editorcontainer" data-text-selector="${selector}">
<div>
      <button class="fontStyle italic" onclick="setElementItalic('${selector}');" title="Italicize Highlighted Text"></button>
      <button class="fontStyle bold" onclick="setElementBold('${selector}');" title="Bold Highlighted Text"></button>
      <button class="fontStyle underline" onclick="setElementUnderLined('${selector}');"></button>
      <select id="input-font${selector}" class="input"  onchange="changeFont('${selector}');">
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Sans serif">Sans serif</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="Georgia">Georgia</option>
        <option value="Palatino">Palatino</option>
        <option value="Garamond">Garamond</option>
        <option value="Comic Sans MS">Comic Sans MS</option>
        <option value="Arial Black">Arial Black</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Comic Sans MS">Comic Sans MS</option>
      </select>
      <button class="fontStyle strikethrough" onclick="setElementLined('${selector}');"><strikethrough></strikethrough></button>
      <button class="fontStyle align-left" onclick="changeButtonAlign('${selector}', 'left');"><justifyLeft></justifyLeft></button>
      <button class="fontStyle align-center" onclick="changeButtonAlign('${selector}', 'center');"><justifyCenter></justifyCenter></button>
      <button class="fontStyle align-right" onclick="changeButtonAlign('${selector}', 'right');"><justifyRight></justifyRight></button> 

      <!-- font size start -->
      <select id="fontSize${selector}" onclick="changeSize('${selector}', this)">
        <option value="10px">1</option>      
        <option value="12px">2</option>
        <option value="14px">3</option>
        <option value="16px">4</option>
        <option value="18px">5</option>
        <option value="20px">6</option>
        <option value="22px">7</option>
        <option value="24px">8</option>
      </select>
      <!-- font size end -->
      </div>
<div>
<span>Цвет текста<input class="color-apply ml-1" type="color" onchange="chooseTextColor('${selector}')" id="myColor${selector}"> </span>
<span>Цвет кнопки<input class="color-apply ml-1" type="color" onchange="chooseButtonColor('${selector}', this)" id="myBtnColor${selector}"> </span>
</div>
<div>
<span>Ссылка: <input class="href" type="text" onchange="setHref('${selector}', this)" placeholder="https://hostco.ru" value="${hrefValue}" id="href${selector}"> </span>
</div>
<div>
<span><i class="fa fa-trash" aria-hidden="true" onclick="if(confirm(\'Вы действительно хотите удалить элемент\')){ $('#${selector}').popover('hide'); window.mjmlManager.deleteMjmlElement('${selector}', true); }"></i> </span>
</div>
  </div>`;
        }
    });

    $('#' + selector).on('show.bs.popover',
        function () {
            hrefValue = mjmlManager.mjmlElementsMap.get(selector).props["href"];
            if (!hrefValue)
                hrefValue = "";
        });
}

function InitPopOverForColumn(sectionId) {
    let blockColorValue = window.mjmlManager.mjmlElementsMap.get(sectionId).props["background-color"];
    if (!blockColorValue)
        blockColorValue = "#000000";

    $(`#${sectionId} .mj-column`).each(function() {
        let selector = this.id;

        let columnPaddingTop = window.mjmlManager.mjmlElementsMap.get(selector).props["padding-top"];
        let columnPaddingBottom = window.mjmlManager.mjmlElementsMap.get(selector).props["padding-bottom"];
        let columnPaddingRight = window.mjmlManager.mjmlElementsMap.get(selector).props["padding-right"];
        let columnPaddingLeft = window.mjmlManager.mjmlElementsMap.get(selector).props["padding-left"];

        let columnColorValue = window.mjmlManager.mjmlElementsMap.get(selector).props["background-color"];
        if (!columnColorValue)
            columnColorValue = "#000000";

        $(`#${selector}`).popover({
            trigger: 'manual',
            html: true,
            container: "body",
            placement: 'left',
            offset: 10,
            content: function() {
                return `<div class="editorcontainer" data-text-selector="${selector}">
      <div>
<div class="row no-gutters"><div class="col-9">Цвет колонки</div><div class="col-3"><input class="color-apply ml-1" type="color" onchange="chooseColumnOrBlockColor('${selector}', this)" id="myBlockColor${selector}" value="${columnColorValue}"></div></div>
<div class="row no-gutters"><div class="col-9">Цвет блока</div><div class="col-3"><input class="color-apply ml-1" type="color" onchange="chooseColumnOrBlockColor('${sectionId}', this)" id="myBlockColor${selector}" value="${blockColorValue}"></div></div>
<div class="row no-gutters"><div class="col-9">Отступ слева</div><div class="col-3"><input class="ml-1 form-control p-0 " type="number" onchange="changePadding('${selector}', this, 'left')" id="myLeftPadding${selector}" value="${columnPaddingLeft}"></div></div>
<div class="row no-gutters"><div class="col-9">Отступ справа</div><div class="col-3"><input class="ml-1 form-control p-0" type="number" onchange="changePadding('${selector}', this, 'right')" id="myRightPadding${selector}" value="${columnPaddingRight}"></div></div>
<div class="row no-gutters"><div class="col-9">Отступ сверху</div><div class="col-3"><input class="ml-1 form-control p-0" type="number" onchange="changePadding('${selector}', this, 'top')" id="myTopPadding${selector}" value="${columnPaddingTop}"></div></div>
<div class="row no-gutters"><div class="col-9">Отступ снизу</div><div class="col-3"><input class="ml-1 form-control p-0" type="number" onchange="changePadding('${selector}', this, 'bottom')" id="myBottomPadding${selector}" value="${columnPaddingBottom}"></div></div>
<div>
<span><i class="fa fa-trash" aria-hidden="true" onclick="if(confirm(\'Вы действительно хотите удалить элемент\')){ $('#${selector}').popover('hide'); window.mjmlManager.deleteMjmlElement('${selector}', true); }"></i> </span>
</div>
</div>
  </div>`;
            }
        });

        $(`#${selector}`).on('show.bs.popover',
            function () {
                let blockSelector = $(this).parent()[0].id;
                blockColorValue = window.mjmlManager.mjmlElementsMap.get(blockSelector).props["background-color"];
                columnColorValue = window.mjmlManager.mjmlElementsMap.get(this.id).props["background-color"];
                columnPaddingTop = window.mjmlManager.mjmlElementsMap.get(this.id).props["padding-top"].slice(0, -2);
                columnPaddingBottom = window.mjmlManager.mjmlElementsMap.get(this.id).props["padding-bottom"].slice(0, -2);
                columnPaddingRight = window.mjmlManager.mjmlElementsMap.get(this.id).props["padding-right"].slice(0, -2);
                columnPaddingLeft = window.mjmlManager.mjmlElementsMap.get(this.id).props["padding-left"].slice(0, -2);
                if (!blockColorValue)
                    blockColorValue = "#000000";
                if (!columnColorValue)
                    columnColorValue = blockColorValue;
            });
    });
}