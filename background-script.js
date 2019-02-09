const chunk = 5;
let cars = [];
let resultSize = null;

function sendMessageToTabs(tabs) {
    for (let tab of tabs) {
        browser.tabs.sendMessage(
            tab.id,
            {action: 'extractLinks'}
        );
    }
}
  
browser.browserAction.onClicked.addListener(() => {
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(sendMessageToTabs);
});

browser.runtime.onMessage.addListener(function(m) {
    if(m.urls){
        asyncExtract(m.urls);
    } else if(m.cleanCars){
        cars = [];
        resultSize = null;
    }
});

async function asyncExtract(urls){
    let i,j,childArray;
    resultSize = 0;
    for (i=0,j=urls.length; i<j; i+=chunk) {
        childArray = urls.slice(i,i+chunk);
        resultSize += childArray.length;
        await chunckAndOpenTab(childArray);
    }
    exportToCsv(cars);
}

async function chunckAndOpenTab(urls){
    const promise = waitForFinish();
    for(let i = 0 ; i < urls.length ; i++){
        openTab(urls[i]);
    }
    await promise;
}

function waitForFinish() {
    return new Promise(resolve => {
        const extractCarCallback = (m, sender) => {
            if (m.car){
                cars.push(m.car);
                browser.tabs.remove(sender.tab.id);
                if(resultSize && cars.length === resultSize){
                    browser.runtime.onMessage.removeListener(extractCarCallback);
                    resolve();
                }
            }
        };
        browser.runtime.onMessage.addListener(extractCarCallback);
    });
}

function openTab(url){
    browser.tabs.create(
        {
            url:url,
            active:true
        }
    );
}

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

            result += typeof item[key] === 'string' && item[key].includes(columnDelimiter) ? `"${item[key]}"` : item[key];
            ctr++;
        });
        result += lineDelimiter;
    });
  
    let blob = new Blob([result], {type: 'text/csv;charset=utf-8'});
    browser.downloads.download({url: URL.createObjectURL(blob), saveAs: true});
}