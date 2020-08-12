

browser.runtime.onMessage.addListener((m, sender, sendResponse) => {
    if(m.action && m.action === 'extractLinks'){
        adsLinks(sendResponse);
    } else if (m.action === 'extractCarData'){
        extractAndSend(sendResponse);
    }
});

function extractCarData(){
    const car = {};
        
    car.title = document.querySelectorAll('[data-qa-id="adview_title"]')[1].textContent;
    car.url = document.URL;

    let price = document.querySelectorAll('[data-qa-id="adview_price"]')[1].textContent;
    price = price.replace(/\s€/, '');
    car.price = price.replace(/\s/, '');

    let mileage = document.querySelectorAll('[data-qa-id="criteria_item_mileage"]')[0].querySelectorAll('div p')[1].textContent;
    car.mileage = mileage.replace(/\skm/, '');
    
    car.year = document.querySelectorAll('[data-qa-id="criteria_item_regdate"]')[0].querySelectorAll('div p')[1].textContent;
    
    return car;
}

function extractAndSend(sendResponse){
    if(window.location.toString().indexOf('recherche/') !== -1){
        return;
    }
    const car = extractCarData();
    //browser.runtime.sendMessage({car: car});
    sendResponse({car: car});
}

function adsLinks(sendResponse){
    const aElements = document.querySelectorAll('a.clearfix.trackable');
    if(!aElements || aElements.length <= 0){
        return;
    }

    const urlList = [];
    aElements.forEach(item => {
        urlList.push(item.href);
    });

    sendResponse({urls: urlList});
}
