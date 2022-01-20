// Для использования требуются подключенные Bootstrap, jquery, lodash, popper, rmodal

var mjmlManager;

(function ($) {
    $('body').on('click', function (e) {
        let sel = window.getSelection().toString();
        $('.insert-element').each(function () {
            // hide any open popovers when the anywhere else in the body is clicked
            if (!$(this).is(e.target) && window.getSelection().toString().trim() === "" &&
                !$(this).find(e.target)[0] &&
                !$('.popover').find(e.target)[0]) {
                $(this).popover('hide');
            }

            if ($(e.target).closest(this)[0] && !$('.editorcontainer')[0]) {
                $(this).popover('show');
            }
        });

        $('.mj-column').each(function () {
            // hide any open popovers when the anywhere else in the body is clicked
            if (!$(this).is(e.target) && window.getSelection().toString().trim() === "" &&
                !$('.popover').find(e.target)[0]) {
                $(this).popover('hide');
            }

            if (($(e.target).hasClass('element-label') && $(this).find(e.target)[0]) || $(e.target).is(this) && !$('.editorcontainer')[0]) {
                $(this).popover('show');
            }
        });
    });

    window.addImageModal();
    window.addSendEmailModal();
    mjmlManager = new MjmlManager();

    var checkElementToDrop = (dragElement, target) => {
        return true;
    };

    var dragElement;
    var afterDropFunc;
    var ticketClickFunc;
    var onDragOverWithContainerEvent;
    var onDragOverWithElementEvent;
    var onDragEnterWithContatiner;
    var onDragEnterWithElementEvent;
    var onDragLeaveWithContainerEvent;
    var onDragLeaveWithElementEvent;
    var onDropElementEvent;
    var onDropContatinerEvent;

    var methods = {
        init: function (options) {
            var constructorBoard = this;
            constructorBoard.addClass('overflow-auto');
            constructorBoard.addClass('p-0');
            constructorBoard.addClass('row');

            let savedBlock = "";

            if (options) {
                if (options.needToShowSaved) {
                    savedBlock = `<div class="card">
    <div class="card-header" id="headingOne" style="
    background-color: #69b5f1;
">
      <h2 class="mb-0">
        <button class="btn btn-block text-center collapsed" type="button" data-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne" style="
    background: #69b5f1;
    color: white;
    font-size: 0.8em;
">
          Сохраненные шаблоны
        </button>
      </h2>
    </div>

    <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordionExample">
      <div class="card-body m-auto">
        <table id="templates-table" class="table table-hover">
            <thead>
                <tr>
                    <th></th>
                    <th>Id</th>
                    <th>Название шаблона</th>
                    <th>Автор</th>
                    <th>Дата создания</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
      </div>
    </div>
  </div>`
                }
            }

            constructorBoard.append(`<div class="col-3 bg-white" >
            <div class="accordion" id="accordionExample">
  <div class="card">
    <div class="card-header" id="headingOne" style="
    background-color: #69b5f1;
">
      <h2 class="mb-0">
        <button class="btn btn-block text-center collapsed" type="button" data-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne" style="
    background: #69b5f1;
    color: white;
    font-size: 0.8em;
">
          Контейнеры
        </button>
      </h2>
    </div>

    <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordionExample">
      <div class="card-body mjml-containers m-auto w-75">
        
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-header" id="headingTwo" style="
    background-color: #69b5f1;
">
      <h2 class="mb-0">
        <button class="btn btn-block text-center collapsed" type="button" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo" style="
    background: #69b5f1;
    color: white;
    font-size: 0.8em;
">
          Элементы
        </button>
      </h2>
    </div>
    <div id="collapseTwo" class="collapse show" aria-labelledby="headingTwo" data-parent="#accordionExample">
      <div class="card-body row mjml-elements justify-content-around">
        
      </div>
    </div>
  </div>
</div>
${savedBlock}
</div>`);

            constructorBoard.append(`<div class="col-9 bg-light pt-3" >
                <div class="w-100 m-auto text-center" id="drop-zone">
                        <div class="w-50 m-auto text-center row border-dotted" id="first-container-label">
                            <div class="m-auto text-center p-5 col">
                                Перетащите сюда свой первый контейнер
                            </div>
                        </div>
                </div>
            </div>`);

            window.mjmlDragDropElements.forEach((el, key) => {
                $('.mjml-containers').append(el.htmlDragButton);
            });

            window.mjmlDragDropInsertElements.forEach((el, key) => {
                $('.mjml-elements').append(el.htmlDragButton);
            });

            document.addEventListener("dragstart", function (event) {
                dragElement = event.target;
                console.log("Started to drag the p element.");
                event.target.style.opacity = "0.4";
            });

            document.addEventListener("drag", function (event) {
                event.preventDefault();
            });

            document.addEventListener("dragend", function (event) {
                console.log("Finished dragging the p element.");
                event.target.style.opacity = "1";
            });


            /* ----------------- Events fired on the drop target ----------------- */

            document.addEventListener("dragenter", function (event) {
                event.preventDefault();

                if (dragElement.classList.contains('mjml-container'))
                    onDragEnterWithContatiner(event);
                if (dragElement.classList.contains('mjml-element'))
                    onDragEnterWithElementEvent(event);

            });

            document.addEventListener("dragover", function (event) {
                event.preventDefault();

                if (dragElement.classList.contains('mjml-container'))
                    onDragOverWithContainerEvent(event);

                if (dragElement.classList.contains('mjml-element'))
                    onDragOverWithElementEvent(event);
            });

            document.addEventListener("dragleave", function (event) {
                if (dragElement.classList.contains('mjml-container'))
                    onDragLeaveWithContainerEvent(event);
                if (dragElement.classList.contains('mjml-element'))
                    onDragLeaveWithElementEvent(event);

            });

            document.addEventListener("drop", async function (event) {
                event.preventDefault();

                if ($(event.target).closest("#drop-zone")[0]) {
                    if (dragElement.classList.contains('mjml-container'))
                        onDropContatinerEvent(event);

                    if (dragElement.classList.contains('mjml-element'))
                        onDropElementEvent(event);

                    console.log(mjmlManager.mjmlElementsMap);
                }

                $(".possible-insert-container").remove();
                $(".possible-insert-element").remove();
            });
        },
        load: async function (url) {
            return mjmlManager.mjmlElementsMap;
        },
        clear: function () {

        }
    };

    onDragOverWithContainerEvent = (event) => {
        if ($(event.target).closest("#drop-zone")[0]) {

            if ($(event.target).closest("#first-container-label")[0]) {
                let firstContainerLabel = $(event.target).closest("#first-container-label")[0];

                firstContainerLabel.style.border = "4px dotted green";
            }

            var container = $(event.target).closest('.container-my')[0];

            if (container) {
                var targetHeight = $(container).offset().top + $(container).height() / 2;

                if (event.pageY > targetHeight) {
                    if (!$(container).siblings('#insert-zone-after')[0]) {
                        $('#insert-zone-before').remove();
                        $(container)
                            .after(
                                `<div class="w-50 mx-auto text-center possible-insert-container p-5 my-2" id="insert-zone-after"></div>`);
                    }
                } else {
                    if (!$(container).siblings('#insert-zone-before')[0]) {
                        $('#insert-zone-after').remove();
                        $(container)
                            .before(
                                `<div class="w-50 mx-auto text-center possible-insert-container p-5 my-2" id="insert-zone-before"></div>`);
                    }
                }
            } else if (!$(event.target).closest('.possible-insert-container')[0]) {
                $('.possible-insert-container').remove();
            }
        }
    };

    onDragOverWithElementEvent = (event) => {
        let column = $(event.target).closest(".mj-column");

        if (column[0] && !column.find('.element-label')[0]) {
            $('.element-label').css('border', 'none');
            let container = $(event.target).closest('.insert-element')[0];

            if (container) {
                let targetHeight = $(container).offset().top + $(container).height() / 2;

                if (event.pageY > targetHeight) {
                    if (!$(container).siblings('#insert-zone-after')[0]) {
                        $('#insert-zone-before').remove();
                        $(container)
                            .after(
                                `<div class="w-50 mx-auto text-center possible-insert-element p-5 my-2" id="insert-zone-after"></div>`);
                    }
                } else {
                    if (!$(container).siblings('#insert-zone-before')[0]) {
                        $('#insert-zone-after').remove();
                        $(container)
                            .before(
                                `<div class="w-50 mx-auto text-center possible-insert-element p-5 my-2" id="insert-zone-before"></div>`);
                    }
                }
            } else if (!column.find('.possible-insert-element')[0]) {
                $('#insert-zone-before').remove();
                column.append(
                    `<div class="w-50 mx-auto text-center possible-insert-element p-5 my-2" id="insert-zone-after"></div>`);
            }
        } else if (!column[0]) {
            $('.possible-insert-element').remove();
        }
    };

    onDragEnterWithContatiner = (event) => {
        if ($(event.target).closest("#first-container-label")[0]) {
            let firstContainerLabel = $(event.target).closest("#first-container-label")[0];

            firstContainerLabel.style.border = "4px dotted green";
        }
    };

    onDragEnterWithElementEvent = (event) => {
        let column = $(event.target).closest(".mj-column");
        if (column[0]) {
            let label = column.find('.element-label');
            if (label[0]) {
                $('.possible-insert-element').remove();
                $('.element-label').css('border', 'none');

                label[0].style.border = "4px dotted green";
            }

        }
    };

    onDragLeaveWithContainerEvent = (event) => {
        if ($(event.target).closest("#first-container-label")[0]) {
            let firstContainerLabel = $(event.target).closest("#first-container-label")[0];

            firstContainerLabel.style.border = "4px dotted #a4b7c1";
        }

    };

    onDragLeaveWithElementEvent = (event) => {
        if (!$(event.relatedTarget).closest(".mj-column")[0]) {
            $('.element-label').css('border', 'none');
        }
    };

    onDropElementEvent = (event) => {
        $('.element-label').css('border', 'none');

        let element;
        let actualId;

        if ($(event.target).closest(".mj-column")[0]) {
            let column = $(event.target).closest(".mj-column");
            let elementLabel = column.find('.element-label');
            let possibleElement = $(event.target).closest(".possible-insert-element");

            if (elementLabel[0]) {
                if (window.mjmlDragDropInsertElements.has(dragElement.id)) {
                    element = window.mjmlDragDropInsertElements.get(dragElement.id);
                    actualId = mjmlManager.addMjmlElementToMap(element, column[0].id);
                }

                if (actualId && element) {
                    let htmlElement = element.htmlElement(actualId);
                    elementLabel.replaceWith(htmlElement);
                    if (actualId.includes('text'))
                        window.configureEditorForText(actualId);
                    if (actualId.includes('button'))
                        window.configureEditorForButton(actualId);
                    if (actualId.includes('image')) {
                        window.imageId = actualId;
                        window.modalReplaceFile.open();
                    }
                    column.removeClass('border-dotted');
                }
            } else if (possibleElement[0] || column.find(".possible-insert-element")[0]) {
                let newElementZone = $(event.target).closest(".possible-insert-element");
                if (!newElementZone[0])
                    newElementZone = column.find(".possible-insert-element");

                if (window.mjmlDragDropInsertElements.has(dragElement.id)) {
                    element = window.mjmlDragDropInsertElements.get(dragElement.id);
                    actualId = mjmlManager.addMjmlElementToMap(element, column[0].id);
                }

                if (actualId && element) {
                    let htmlElement = element.htmlElement(actualId);
                    newElementZone.replaceWith(htmlElement);
                    if (actualId.includes('text'))
                        window.configureEditorForText(actualId);
                    if (actualId.includes('button'))
                        window.configureEditorForButton(actualId);
                    if (actualId.includes('image')) {
                        window.imageId = actualId;
                        window.modalReplaceFile.open();
                    }
                }
            }
        }
    };

    onDropContatinerEvent = (event) => {
        let dropzone = $(event.target).closest("#drop-zone");
        let element;
        let actualId;


        if ($(event.target).closest("#first-container-label")[0]) {
            let firstContainerLabel = $(event.target).closest("#first-container-label");
            firstContainerLabel.remove();

            if (window.mjmlDragDropElements.has(dragElement.id)) {
                element = window.mjmlDragDropElements.get(dragElement.id);
                actualId = mjmlManager.addMjmlElementToMap(element);
            }

            if (window.mjmlDragDropInsertElements.has(dragElement.id)) {
                element = window.mjmlDragDropInsertElements.get(dragElement.id);
                actualId = mjmlManager.addMjmlElementToMap(element);
            }

            if (actualId && element) {
                let htmlInsideElements = "";
                let insideElements = mjmlManager.getInsideMjmlObjects(actualId);

                for (let insideElem of insideElements.entries()) {
                    htmlInsideElements += insideElem[1].htmlElement(insideElem[0]);
                }

                let htmlElement = element.htmlElement(actualId, htmlInsideElements);
                dropzone.prepend(htmlElement);
            }
        }

        let possibleElement = $(event.target).closest(".possible-insert-container");

        if (possibleElement[0] || dropzone.find(".possible-insert-container")[0]) {
            let newElementZone = $(event.target).closest(".possible-insert-container");
            if (!newElementZone[0])
                newElementZone = dropzone.find(".possible-insert-container");

            if (window.mjmlDragDropElements.has(dragElement.id)) {
                element = window.mjmlDragDropElements.get(dragElement.id);
                actualId = mjmlManager.addMjmlElementToMap(element);
            }

            if (actualId && element) {
                let htmlInsideElements = "";
                let insideElements = mjmlManager.getInsideMjmlObjects(actualId);

                for (let insideElem of insideElements.entries()) {
                    htmlInsideElements += insideElem[1].htmlElement(insideElem[0]);
                }

                let htmlElement = element.htmlElement(actualId, htmlInsideElements);
                newElementZone.replaceWith(htmlElement);
            }
        }

        if (actualId) {
            window.InitPopOverForColumn(actualId);
        }
    };

    $.fn.mjml = function (method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод с именем ' + method + ' не существует для jQuery.mjml');
        }
    };

})(jQuery);