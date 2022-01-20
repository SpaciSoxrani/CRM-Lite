var mjmlDragDropElements = new Map([
    ["one-parent-column", {
        htmlDragButton: `<div class="container-fluid">
                <div class="text-left">1 Колонка</div>
                <div class="bg-light border rounded mt-2 row mjml-container" id="one-parent-column" draggable="true">
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                </div>
                  </div>`,
        htmlElement: (id, insideElements) => `<div class="w-50 m-auto text-center row no-gutters container-my" id="${id}">
                            ${insideElements}
                        </div>`,
        id: "one-parent-column",
        mjmlObj: {
            props: {},
            returnedMjml: function (children, props) {
                return `<mj-section ${props}>
                        ${children}
                    </mj-section>`;
            },
            insideMjmlIds: ["reserved-column-with-picture"]
        }
    }],
    ["two-parent-columns", {
        htmlDragButton: `<div class="container-fluid">
                <div class="text-left">2 Колонки</div>
                <div class="bg-light border rounded mt-2 row mjml-container" id="two-parent-columns" draggable="true">
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                </div>
                  </div>`,
        htmlElement: (id, insideElements) => `<div class="w-50 m-auto text-center row no-gutters container-my" id="${id}">
                            ${insideElements}
                        </div>`,
        id: "two-parent-columns",
        mjmlObj: {
            props: {},
            returnedMjml: function (children, props) {
                return `<mj-section ${props}>
                        ${children}
                    </mj-section>`;
            },
            insideMjmlIds: ["reserved-column-with-picture", "reserved-column-with-picture"]
        }
    }],
    ["three-parent-columns", {
        htmlDragButton: `<div class="container-fluid">
                <div class="text-left">3 Колонки</div>
                <div class="bg-light border rounded mt-2 row mjml-container" id="three-parent-columns" draggable="true">
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                </div>
                  </div>`,
        htmlElement: (id, insideElements) => `<div class="w-50 m-auto text-center row no-gutters container-my" id="${id}">
                            ${insideElements}
                        </div>`,
        id: "three-parent-columns",
        mjmlObj: {
            props: {},
            returnedMjml: function (children, props) {
                return `<mj-section ${props}>
                        ${children}
                    </mj-section>`;
            },
            insideMjmlIds: ["reserved-column-without-picture", "reserved-column-without-picture", "reserved-column-without-picture"]
        }
    }],
    ["four-parent-columns", {
        htmlDragButton: `<div class="container-fluid">
                <div class="text-left">4 Колонки</div>
                <div class="bg-light border rounded mt-2 row mjml-container" id="four-parent-columns" draggable="true">
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                    <div class="border rounded bg-white m-2 p-2 col"></div>
                </div>
                  </div>`,
        htmlElement: (id, insideElements) => `<div class="w-50 m-auto text-center row no-gutters container-my" id="${id}">
                            ${insideElements}
                        </div>`,
        id: "four-parent-columns",
        mjmlObj: {
            props: {},
            returnedMjml: function (children, props) {
                return `<mj-section ${props}>
                        ${children}
                    </mj-section>`;
            },
            insideMjmlIds: ["reserved-column-without-picture", "reserved-column-without-picture", "reserved-column-without-picture", "reserved-column-without-picture"]
        }
    }]
]);

var mjmlDragDropInsertElements = new Map([
    ["text", {
        htmlDragButton: `<div class="col-xl-3 col-sm-12 border rounded text-center mb-2 mjml-element" draggable="true" id="text">
<svg color="darkgrey" class="StyledIcon-sc-15jxfmr-0 dqCQzj TextContent-sc-17dvhq6-0 dYzYBl c-g c-n TextContent-sc-17dvhq6-0 dYzYBl"><g><path d="M45.83 16.35V14.5h-7.8v1.85h3.12V38.5h-3.12v1.84h7.8V38.5h-3.12V16.35h3.12zM15.06 8L2.7 40.34h4.4l3.05-8.46H23.7l3.09 8.46h4.38L18.79 8zm-3.62 20.4l5.48-15.13 5.51 15.13z"></path></g></svg>
<p>Текст</p>
</div>`,
        htmlElement: (id) => `<div class="text-element insert-element" data-placement="top" style="margin-left: 20px;margin-right: 20px;" tabindex="1" id="${id}" contenteditable="true" onclick="if (this.innerHTML === 'Введите сюда текст') {
  $(this).selectText();
  }" oninput="mjmlManager.changeTextValue(this.id, this.innerText)">Введите сюда текст</div>`,
        id: "text",
        mjmlObj: {
            props: {
                "align": "center",
                "font-family": "Arial",
                "font-weight": "normal",
                "text-decoration": "none",
                "font-style": "normal"
            },
            returnedMjml: function (children, props) { return `<mj-text ${props}>${children}</mj-text>`; },
            insideMjmlIds: ["Введите сюда текст"]
        }
    }],
    ["button", {
        htmlDragButton: `<div class="col-xl-3 col-sm-12 border rounded text-center mb-2 mjml-element" draggable="true" id="button">
<svg color="darkgrey" class="StyledIcon-sc-15jxfmr-0 dqCQzj ButtonContent-eijch0-0 hMyTkF c-g c-n ButtonContent-eijch0-0 hMyTkF"><g><path d="M45 8.33H3a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h20.2v-2H3a1 1 0 0 1-1-1v-18a1 1 0 0 1 1-1h42a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H30.3l2 2H45a3 3 0 0 0 3-3v-18a3 3 0 0 0-3-3z"></path><path d="M24.2 25.63v11.2l2.56-2.47L29.13 40l1.84-.77-2.26-5.4h3.69l-8.2-8.2z"></path></g></svg>
<p>Кнопка-ссылка</p>
</div>`,
        htmlElement: (id) => `<button class="button-element insert-element d-block" data-placement="top" 
style="cursor: text;margin-left: 10px;margin-right: 10px;margin-top: 10px;border-radius: 5px;background-color: #2da8d4;color: white;padding-right: 5px;padding-top: 5px;padding-bottom: 5px;padding-left: 5px;"
id="${id}" oninput="mjmlManager.changeTextValue(this.id, this.innerText)" ondblclick='renameButton(this)'>
    <div class="editable-element">Двойной клик для текста</div>
    </button>`,
        id: "button",
        mjmlObj: {
            props: {
                "href": "",
                "background-color": "#2da8d4",
                "border-radius": "7px",
                "color": "white",
                "padding-top": "10px",
                "font-weight": "normal",
                "text-decoration": "none",
                "font-style": "normal"
            },
            returnedMjml: function (children, props) { return `<mj-button ${props}>${children}</mj-button>`; },
            insideMjmlIds: ["Введите сюда текст"]
        }
    }],
    ["image", {
        htmlDragButton: `<div class="col-xl-3 col-sm-12 border rounded text-center mb-2 mjml-element" draggable="true" id="image">
<svg color="darkgrey" class="StyledIcon-sc-15jxfmr-0 dqCQzj ImageContent-de3yl7-0 eJfgot c-g c-n ImageContent-de3yl7-0 eJfgot"><g><path d="M45 4.33H3a3 3 0 0 0-3 3v34a3 3 0 0 0 3 3h42a3 3 0 0 0 3-3v-34a3 3 0 0 0-3-3zm1 37a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-34a1 1 0 0 1 1-1h42a1 1 0 0 1 1 1z"></path><path d="M14 14.33a4 4 0 1 0-4 4 4 4 0 0 0 4-4zm-6 0a2 2 0 1 1 2 2 2 2 0 0 1-2-2zm23.42 5.58a2.61 2.61 0 0 0-1.74-.66 2.64 2.64 0 0 0-1.68.6L16.87 29a.51.51 0 0 1-.31.11.47.47 0 0 1-.33-.14l-.89-.85a1.87 1.87 0 0 0-2.84.32l-4.62 7.22a1.75 1.75 0 0 0 1.55 2.67h30.74A1.79 1.79 0 0 0 42 36.58v-6.53a1.7 1.7 0 0 0-.59-1.29zM40 36.33H9.82l4.26-6.64.76.74a2.52 2.52 0 0 0 1.72.69 2.45 2.45 0 0 0 1.58-.57l8.08-6.64 3.06-2.52a.59.59 0 0 1 .4-.14.64.64 0 0 1 .42.16l9.9 8.77z"></path></g></svg>
<p>Картинка</p>
</div>`,
        htmlElement: (id) => `<div class="image-element insert-element" style="" id="${id}"><img id="img-for-${id}" src="#" alt="your image" width="100%" /></div>`,
        id: "image",
        mjmlObj: {
            props: {
                "padding": "0px 0px"
            },
            returnedMjml: function (children, props) { return `<mj-image ${props}>${children}</mj-image>`; },
            insideMjmlIds: []
        }
    }],
    ["divider", {
        htmlDragButton: `<div class="col-xl-5 col-sm-12 invisible border rounded text-center mb-2 mjml-element" draggable="false" id="divider">
<svg color="darkgrey" class="StyledIcon-sc-15jxfmr-0 dqCQzj DividerContent-sc-2ozj9v-0 exyeac c-g c-n DividerContent-sc-2ozj9v-0 exyeac"><g><path d="M46.74 23.33H1a1 1 0 0 0 0 2h45.74a1.16 1.16 0 0 0 1.26-1 1.16 1.16 0 0 0-1.26-1zM45 7.17a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h42m0-2H3a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h42a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3zm0 28a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h42m0-2H3a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h42a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3z"></path></g></svg>
<p>Divider</p>
</div>`,
        id: "divider",
        mjmlObj: {
            props: {},
            returnedMjml: function (children, props) { return `<mj-divider ${props}>${children}</mj-divider>`; },
            insideMjmlIds: []
        }
    }],
]);