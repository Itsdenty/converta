import "../style/main.css";
import idb from 'idb';

const click = document.getElementById("click");
const currencyFrom = document.getElementById("currency_from");
const currencyTo = document.getElementById("currency_to");
const baseUrl = "https://free.currencyconverterapi.com";

if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
            if (!navigator.serviceWorker.controller) {
                return;
            }

            if (reg.waiting) {
                updateReady(reg.waiting);
                return;
            }

            if (reg.installing) {
                trackInstalling(reg.installing);
                return;
            }

            reg.addEventListener('updatefound', function () {
                trackInstalling(reg.installing);
            });
        });
    });
}

Notification.requestPermission().then(function(result) {
    if (result === 'denied') {
        console.log('Permission wasn\'t granted. Allow a retry.');
        return;
    }
    if (result === 'default') {
        console.log('The permission request was dismissed.');
        return;
    }
});

const updateReady = (worker) => {
    worker.postMessage({action: 'skipWaiting'});
};

const trackInstalling = (worker) => {
    worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
        updateReady(worker);
    }
    });
};

const openCurrencyDataBase = () => {
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('currency', 1, (upgradeDb) => {
        const store = upgradeDb.createObjectStore('currencies', {
            keyPath: 'id'
        })
    })
};

const openConversionDataBase = () => {
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('conversion', 1, (upgradeDb) => {
        const store = upgradeDb.createObjectStore('conversions', {
            keyPath: 'id'
        })
    })
};



const fetchCurrenciesLocally =  () => {
    console.log("local");
    if (currencyFrom.options.length == 0) {
        openCurrencyDataBase().then((db) => {
            if (!db || currencyFrom.children.length > 0) return;
            const store = db.transaction('currencies').objectStore('currencies');
            return store.getAll().then((currencies) => {
                currencies.forEach((currency) => {
                    const opt = document.createElement("option");
                    opt.value = currency.id;
                    opt.innerHTML = currency.id;

                    const opt2 = document.createElement("option");
                    opt2.value = currency.id;
                    opt2.innerHTML = currency.id;

                    currencyFrom.appendChild(opt);
                    currencyTo.appendChild(opt2);

                });
                console.log(currencyFrom.options.length);
                if (currencyFrom.options.length == 0) {
                    fetchCurrenciesOnline();
                }
            })
        });
    }
};

const handleErrors = (response) => {
    if(!response) {
        throw Error(response.statusText);
    }
    return response;
};

const fetchCurrenciesOnline = () => {
    console.log("Online");
    fetchCurrenciesLocally();
    fetch(`${baseUrl}/api/v5/currencies`)
        .then(handleErrors)
        .then(
            (response) => {
                return response.json()
            })
        .then(
            (data) => {
                // console.log(data.results);
                let currencies = data.results;
                openCurrencyDataBase().then((db) => {
                    if (!db) return;
                    const tx = db.transaction('currencies', 'readwrite');
                    const store = tx.objectStore('currencies');
                    let currencyList = Object.keys(currencies);
                    let convertKeys = [];
                    currencyList.forEach((currencyKey) => {
                        store.put(currencies[currencyKey]);
                        let others = currencyList.filter((element, index) => {
                            return index > currencyList.indexOf(currencyKey);
                        });
                        others.forEach((other) => {
                           convertKeys.push(`${currencyKey}_${other}`);
                        })
                    });
                    // console.log(convertKeys);
                });
                fetchCurrenciesLocally()
            }
        ).catch((error) => {
        console.log(error)
    });
};

fetchCurrenciesOnline();

const convertLocal = (key) => {
    openConversionDataBase().then((db) => {
        if (!db) return;
        const store = db.transaction('conversions').objectStore('conversions');
        return store.get(key).then((rate) => {
            if(rate != null){
                return rate[key];
            } else {
                return null;
            }
        })
    })
};


click.onclick = (event) => {
    if(currencyFrom.value != currencyTo.value){
        const rate = convertLocal(`${currencyFrom.value}_${currencyTo.value}`);
        console.log(rate);
        fetch(`${baseUrl}/api/v5/convert?q=${currencyFrom.value}_${currencyTo.value}&compact=ultra`)
            .then(
                (response) => {
                    return response.json()
                }).then(
            (data) => {
                let keys = Object.keys(data);
                // console.log(keys);
                openConversionDataBase().then((db) => {
                    if(!db) return;
                    const tx = db.transaction('conversions', 'readwrite');
                    const store = tx.objectStore('conversions');
                    keys.forEach((key) => {
                        store.put({id:key, data:data})
                    })
                });
                const rate = convertLocal(`${currencyFrom.value}_${currencyTo.value}`);
                console.log(rate);
            }
        ).catch((error) => {
            console.log(error)
        })
    } else {
        console.log("same currency");
    }
};

