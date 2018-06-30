import "../style/main.css";
import idb from 'idb';

const convertButton = document.getElementById("convert");
const currencyFrom = document.getElementById("currency_from");
const currencyTo = document.getElementById("currency_to");
const convertFrom = document.getElementById("from");
const convertTo = document.getElementById("to");
const baseUrl = "https://free.currencyconverterapi.com";


// register service worker
if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((reg) => {
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

// ask for notification permission
Notification.requestPermission();


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


// function for opening currency database
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

// function for opening conversion database
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


// function for fetching currency from database
const fetchCurrenciesLocally =  () => {
    if (currencyFrom.options.length == 0) {
        openCurrencyDataBase().then((db) => {
            if (!db || currencyFrom.children.length > 0) return;
            const store = db.transaction('currencies').objectStore('currencies');
            return store.getAll().then((currencies) => {
                currencies.forEach((currency) => {
                    const opt = document.createElement("option");
                    opt.value = currency.id;
                    opt.innerHTML = `${currency.id} (${currency.currencyName})`;

                    const opt2 = document.createElement("option");
                    opt2.value = currency.id;
                    opt2.innerHTML = `${currency.id} (${currency.currencyName})`;

                    currencyFrom.appendChild(opt);
                    currencyTo.appendChild(opt2);

                });
                if (currencyFrom.options.length == 0) {
                    fetchCurrenciesOnline();
                }
            })
        });
    }
};


// function for handling errors
const handleErrors = (response) => {
    if(!response) {
        throw Error(response.statusText);
    }
    return response;
};


// function for fetching currencies online
const fetchCurrenciesOnline = () => {
    fetchCurrenciesLocally();
    fetch(`${baseUrl}/api/v5/currencies`)
        .then(handleErrors)
        .then(
            (response) => {
                return response.json()
            })
        .then(
            (data) => {
                let currencies = data.results;
                openCurrencyDataBase().then((db) => {
                    if (!db) return;
                    const tx = db.transaction('currencies', 'readwrite');
                    const store = tx.objectStore('currencies');
                    let currencyList = Object.keys(currencies);
                    currencyList.forEach((currencyKey) => {
                        store.put(currencies[currencyKey]);
                    });
                });
                fetchCurrenciesLocally()
            }
        ).catch((error) => {
        console.log(error)
    });
};

// fetch currency online
fetchCurrenciesOnline();

// function for converting online
const convertOnline = () => {
    fetch(`${baseUrl}/api/v5/convert?q=${currencyFrom.value}_${currencyTo.value}&compact=ultra`)
        .then(handleErrors)
        .then(
            (response) => {
                return response.json()
            }).then(
        (data) => {
            let keys = Object.keys(data);
            openConversionDataBase().then((db) => {
                if(!db) return;
                const tx = db.transaction('conversions', 'readwrite');
                const store = tx.objectStore('conversions');
                keys.forEach((key) => {
                    store.put({id:key, rate:data[key]})
                });
                convertTo.value = convertFrom.value * data[keys[0]];
            });
        }
    ).catch((error) => {
        console.log(error);
        if(convertTo.value === ""){
            alert("oops! you should go online for this particular conversion rate")
        }
    });
};


// function for converting currency locally
const convertLocal = (key) => {
        convertTo.value = "";
        openConversionDataBase().then((db) => {
            if (!db) return;
            const store = db.transaction('conversions').objectStore('conversions');
            return store.get(key).then((data) => {
                if(data !== undefined){
                    convertTo.value = convertFrom.value * data["rate"];
                    convertOnline();
                } else {
                    const splitStr = key.split("_");
                    const revKey = `${splitStr[1]}_${splitStr[0]}`;
                    openConversionDataBase().then((db) => {
                        if (!db) return;
                        const store = db.transaction('conversions').objectStore('conversions');
                        return store.get(revKey).then((data) => {
                            if(data !== undefined){
                                convertTo.value = convertFrom.value / data["rate"];
                            } else {
                                convertOnline();
                            }
                        })
                    })

                }
            })
        })

};


// event listener for converting
convertButton.onclick = (event) => {
    if(currencyFrom.value !== currencyTo.value){
        convertLocal(`${currencyFrom.value}_${currencyTo.value}`);
    } else {
        convertTo.value = convertFrom.value;
    }
};

