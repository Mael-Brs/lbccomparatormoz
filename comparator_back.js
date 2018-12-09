adsLinks();
extractAndSend();

function extractCarData(){
    const car = {};
    let price = document.querySelector('.eVLNz ._386c2 ._1F5u3').textContent;
    price = price.replace(/\s€/, '');
    car.price = price.replace(/\s/, '');
    
    car.year = document.querySelectorAll('._2B0Bw._1nLtd ._3Jxf3')[2].textContent;
    
    let mileage = document.querySelectorAll('._2B0Bw._1nLtd ._3Jxf3')[3].textContent;
    car.mileage = mileage.replace(/\skm/, '');
    
    car.title = document.querySelector('._1KQme').textContent;
    
    car.url = document.URL;

    return car;
}

function extractAndSend(){
    if(window.location.toString().indexOf('voitures/offres') !== -1){
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
    
    browser.runtime.sendMessage({cleanCars: true});
    

    let i,j
    const chunk = 10;
    for (i=0,j=aElements.length; i<j; i+=chunk) {
        await chunckAndPostData(aElements.slice(i,i+chunk));
    }

}

async function chunckAndPostData(aElements){
    for(let i = 0 ; i < aElements.length ; i++){
        browser.runtime.sendMessage({url: aElements[i].href});
    }
    browser.runtime.sendMessage({resultSize: aElements.length});

    await waitForFinish();
}

function waitForFinish() {
    return new Promise(resolve => {
        browser.runtime.onMessage.addListener(function(m) {
            if(m.extractFinished){
                resolve();
            }
        });
    });
}
