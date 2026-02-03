

browser.runtime.onMessage.addListener((m) => {
    if(m.action && m.action === 'extractLinks'){
        return Promise.resolve(adsLinks());
    } else if (m.action === 'extractCarData'){
        return Promise.resolve(extractAndSend());
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

function extractAndSend(){
    if(window.location.toString().indexOf('recherche/') !== -1){
        return null;
    }
    const car = extractCarData();
    return {car: car};
}

function adsLinks(){
    const aElements = document.querySelectorAll('a[href*="/ad/"]');
    if(!aElements || aElements.length <= 0){
        return null;
    }

    const urlSet = new Set();
    aElements.forEach(item => {
        urlSet.add(item.href);
    });

    return {urls: Array.from(urlSet)};
}
