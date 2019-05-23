
extractAndSend();

browser.runtime.onMessage.addListener((m) => {
    if(m.action && m.action === 'extractLinks'){
        adsLinks();
    }
});

function extractCarData(){
    const car = {};
        
    car.title = document.querySelector('._246DF._2S4wz').textContent;
    car.url = document.URL;

    let price = document.querySelector('.eVLNz ._386c2 ._1F5u3').textContent;
    price = price.replace(/\s€/, '');
    car.price = price.replace(/\s/, '');

    let mileage = document.querySelectorAll('._2B0Bw._1nLtd ._3Jxf3')[3].textContent;
    car.mileage = mileage.replace(/\skm/, '');
    
    car.year = document.querySelectorAll('._2B0Bw._1nLtd ._3Jxf3')[2].textContent;

    return car;
}

function extractAndSend(){
    if(window.location.toString().indexOf('recherche/') !== -1){
        return;
    }
    const car = extractCarData();

    browser.runtime.sendMessage({car: car});
}

function adsLinks(){
    const aElements = document.querySelectorAll('a.clearfix.trackable');
    if(!aElements || aElements.length <= 0){
        return;
    }
    // Delete data in memory
    browser.runtime.sendMessage({cleanCars: true});

    const urlList = [];
    aElements.forEach(item => {
        urlList.push(item.href);
    });

    browser.runtime.sendMessage({urls: urlList});

}
