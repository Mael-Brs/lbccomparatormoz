const chunk = 5;
let cars = [];
let resultSize = null;
let urlList = null;
const filter = {
    url:
    [
        {hostContains: 'leboncoin.fr'}
    ]
};
let tabIds = null;

/**
 * Send extract notification to content script
 * @param {Browser tabs} tabs 
 */
function sendUrlsExtractMessage(tabs) {
    for (let tab of tabs) {
        browser.tabs.sendMessage(
            tab.id,
            {action: 'extractLinks'},
            extractUrlsCallback
        );
    }
}

function extractUrlsCallback(response) {
    if(response.urls){
        resultSize = 0;
        asyncExtract(response.urls);
    }
}

/**
 * Toolbar button click action
 */
browser.browserAction.onClicked.addListener(() => {
    cars = [];
    tabIds = [];
    resultSize = null;
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(sendUrlsExtractMessage);
});

/**
 * Chunck list of ads urls to extract
 * @param {Array<String>} urls 
 */
function asyncExtract(urls){
    let childArray = urls.splice(0,chunk);
    urlList = urls;
    resultSize += childArray.length;
    chunckAndOpenTab(childArray);
}
  
function logOnCompleted(details) {
    if(tabIds !== null && tabIds.indexOf(details.tabId) > -1){
        sendExtractCarRequest(details)
    }
}

function sendExtractCarRequest(details){
    setTimeout(() => {

        browser.tabs.sendMessage(
            details.tabId,
            {action: 'extractCarData'}
        ).then(response =>{
            if (response.car){
                cars.push(response.car);     
                browser.tabs.remove(details.tabId);
                if(cars.length === resultSize){
                    if(urlList.length > 0){
                        asyncExtract(urlList);
                    } else {
                        exportToCsv(cars);
                    }
                }
            }
        });
    } , 5000);
}
  
browser.webNavigation.onCompleted.addListener(logOnCompleted, filter);

/**
 * Open tab and wait for extracting response
 * @param {*} urls 
 */
function chunckAndOpenTab(urls){
    for(let i = 0 ; i < urls.length ; i++){
        openTab(urls[i]);
    }
}

/**
 * Open a tab
 * @param {String} url 
 */
function openTab(url){
    browser.tabs.create(
        {
            url:url,
            active:true
        }
    ).then(onCreated);
}

function onCreated(tab) {
    tabIds.push(tab.id);
}

/**
 * Export data to csv file
 * @param {String} data 
 */
function exportToCsv(data){

    const columnDelimiter = ',';
    const lineDelimiter = '\n';
    let result, ctr, keys;

    if (data === null || !data.length) {
        return null;
    }

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;
    data.forEach(item => {
        ctr = 0;
        keys.forEach(key => {
            if (ctr > 0) {
                result += columnDelimiter;
            }

            result += typeof item[key] === 'string' && item[key].includes(columnDelimiter) ? `'${item[key]}'` : item[key];
            ctr++;
        });
        result += lineDelimiter;
    });
  
    let blob = new Blob([result], {type: 'text/csv;charset=utf-8'});
    browser.downloads.download({url: URL.createObjectURL(blob), saveAs: true, filename:'result.csv'});
    // const createData = {
    //     type: 'detached_panel',
    //     url: 'data-window.html',
    //     width: 250,
    //     height: 100
    // };
    //browser.windows.create(createData);
}