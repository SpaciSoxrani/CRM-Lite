//require autocomplete.js

function initSearchBar(){
    const $searchInput = $('#main-search-input');
    $searchInput.autocomplete({
        autoselect: true,
        autoselectOnBlur: false,
        openOnFocus: true,
        minLength: 3
    }, [
        {
            source: async function(query, callback) {
                const response = await fetch(`${currentHost}/Search/Keywords?pattern=` + query);
                if (response.ok){
                    const results = await response.json();
                    callback(results);
                }
            },
            displayKey: function (suggestion) {
                return suggestion;
            },
            templates: {
                suggestion: function (suggestion) {
                    return `<div style="position: relative; z-index: 999;"><span class="small text-dark"><i class="fa fa-search mr-2"></i>${suggestion}</span></div>`;
                }

            }
        }
    ]);

    $searchInput.on("keydown",
        async function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const searchRequest = $("#main-search-input").val();
                if (searchRequest != undefined && searchRequest != "") {
                    await initSearchResults($("#search-modal-wrapper"), searchRequest);
                }
            }
        });

    $("#main-search-button").on('click',
        async function() {
            const searchRequest = $("#main-search-input").val();
            if (searchRequest != undefined && searchRequest != "") {
                await initSearchResults($("#search-modal-wrapper"), searchRequest);
            }
        });
}

async function initSearchResults($wrapper, searchRequest){
    const response = await fetch(`${currentHost}/Search/Results?pattern=` + searchRequest);
    const results = await response.json();
    $wrapper.empty();
    $wrapper.append(getModalView(results.items));
    $("#results-modal").modal("show");
}

function getModalView(searchResults){
    const resultsView = searchResults.length != 0 
        ? searchResults.map(result => getResultView(resizeImages(result))).join("<hr>") 
        : `<span class="lead">По вашему запросу не было найдено результатов.</span>`;
    
    return `<div id="results-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-lg">
                <div class="modal-content p-4">
                    ${resultsView}
                </div>
              </div>
            </div>`;
}

function resizeImages(result){
    result.description = result.description.replace(/<img/g, '<img style="max-width: 600px;"');
    return result
}

function getResultView(result){
    return `<div>
                <h3>${result.title}</h3>
                <div>
                    ${result.description}
                </div>
            </div>` 
}

