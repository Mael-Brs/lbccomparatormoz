// LeBonCoin Car Scraper - Playwright script
// Usage: node scraper.js <search_url>

const { chromium } = require('playwright');
const ss = require('simple-statistics');

async function scrapeCars(searchUrl) {
    const browser = await chromium.launch({
        headless: false  // Use headed mode to avoid bot detection
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    // Handle cookie consent dialog if present
    try {
        const consentBtn = page.getByRole('button', { name: 'Continuer sans' });
        await consentBtn.click({ timeout: 5000 });
        await page.waitForTimeout(500);
    } catch (e) {
        // No consent dialog
    }

    // Wait for articles to appear
    await page.waitForSelector('article', { timeout: 15000 });

    // Extract car data directly from search results
    const cars = await page.evaluate(() => {
        const results = [];
        const articles = document.querySelectorAll('article');

        articles.forEach(article => {
            try {
                const link = article.querySelector('a[href*="/ad/"]');
                if (!link) return;

                const url = link.href;

                // Title from heading
                const heading = article.querySelector('h3, h2');
                const title = heading ? heading.textContent.trim() : '';

                const fullText = article.textContent;

                // Price (number followed by €)
                const priceMatch = fullText.match(/(\d[\d\s]*)\s*€/);
                const price = priceMatch ? priceMatch[1].replace(/\s/g, '') : '';

                // Year (4 digits 202x)
                const yearMatch = fullText.match(/\b(202[0-9])\b/);
                const year = yearMatch ? yearMatch[1] : '';

                // Mileage (number followed by km)
                const mileageMatch = fullText.match(/(\d[\d\s]*)\s*km/i);
                const mileage = mileageMatch ? mileageMatch[1].replace(/\s/g, '') : '';

                if (url && title) {
                    results.push({ title, url, price, year, mileage });
                }
            } catch (e) {}
        });

        return results;
    });

    await browser.close();
    return cars;
}

function analyzeCars(cars) {
    // Filter cars with valid price and mileage
    const validCars = cars.filter(car => {
        const price = Number.parseInt(car.price, 10);
        const mileage = Number.parseInt(car.mileage, 10);
        return !Number.isNaN(price) && !Number.isNaN(mileage) && price > 0 && mileage > 0;
    }).map(car => ({
        ...car,
        price: Number.parseInt(car.price, 10),
        mileage: Number.parseInt(car.mileage, 10)
    }));

    if (validCars.length < 2) {
        console.log('Not enough data for regression analysis');
        return validCars;
    }

    // Prepare data points [mileage, price]
    const dataPoints = validCars.map(car => [car.mileage, car.price]);

    // Linear regression: price = m * mileage + b
    const regression = ss.linearRegression(dataPoints);
    const regressionLine = ss.linearRegressionLine(regression);

    console.log('\n--- Linear Regression Analysis ---');
    console.log(`Formula: price = ${regression.m.toFixed(2)} * mileage + ${regression.b.toFixed(0)}`);
    console.log('(Negative slope means price decreases with mileage)\n');

    // Calculate expected price and difference for each car
    const analyzedCars = validCars.map(car => {
        const expectedPrice = regressionLine(car.mileage);
        const priceDiff = car.price - expectedPrice;
        const priceDiffPercent = (priceDiff / expectedPrice) * 100;
        return {
            ...car,
            expectedPrice: Math.round(expectedPrice),
            priceDiff: Math.round(priceDiff),
            priceDiffPercent: priceDiffPercent.toFixed(1)
        };
    });

    // Sort by price difference (best deals first = most negative)
    analyzedCars.sort((a, b) => a.priceDiff - b.priceDiff);

    return analyzedCars;
}

function printResults(cars) {
    console.log('\n--- Best Deals (sorted by value) ---\n');

    cars.forEach((car, i) => {
        const indicator = car.priceDiff < 0 ? '✅' : '❌';
        console.log(`${i + 1}. ${indicator} ${car.title}`);
        console.log(`   Price: ${car.price}€ | Expected: ${car.expectedPrice}€ | Diff: ${car.priceDiff}€ (${car.priceDiffPercent}%)`);
        console.log(`   Mileage: ${car.mileage} km | Year: ${car.year}`);
        console.log(`   ${car.url}\n`);
    });
}

// Main
const url = process.argv[2] || 'https://www.leboncoin.fr/recherche?category=2&text=dacia+jogger';

scrapeCars(url).then(cars => {
    console.log(`\nTotal scraped: ${cars.length} cars`);
    const analyzed = analyzeCars(cars);
    printResults(analyzed);
}).catch(console.error);