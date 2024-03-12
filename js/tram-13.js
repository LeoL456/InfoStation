const urlArret = "./json/arrets-tram-13-ger.json";
let jsonTramA;
let jsonTramR;
let jsonArrets;
let stop_Id_A;
let stop_Id_R;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const getLine = urlParams.get('line').toString();
console.log(getLine)

if (!getLine) {
    document.location.href = "index.html";
}

if (localStorage.getItem("stopIdTram13A") !== null && localStorage.getItem("stopIdTram13A") !== undefined) {
    stop_Id_A = localStorage.getItem("stopIdTram13A");
}

if (localStorage.getItem("stopIdTram13R") !== null && localStorage.getItem("stopIdTram13R") !== undefined) {
    stop_Id_R = localStorage.getItem("stopIdTram13R");
}

function updateHorairesTram(stopIdA = 481067, stopIdR = 480904, line = "1") {
    const url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring';

    const headers = {
        'Accept': 'application/json',
        'apikey': "SA2gwXmU8tMANuVvb1cei7oQc3FjEGOQ"
    };

    const sendRequest = (stopId, callback) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${url}?MonitoringRef=STIF:StopPoint:Q:${stopId}:`, true);

        for (const key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const jsonResponse = JSON.parse(xhr.responseText);
                callback(jsonResponse);
            } else if (xhr.readyState === 4) {
                console.error("Erreur lors de la récupération des données", xhr.statusText);
            }
        };

        xhr.send();
    };

    sendRequest(stopIdA, function (jsonResponse) {
        jsonTramA = jsonResponse;
    });
    console.log("Réponse pour l'arrêt A:", jsonTramA);

    sendRequest(stopIdR, function (jsonResponse) {
        jsonTramR = jsonResponse;
    });
    console.log("Réponse pour l'arrêt R:", jsonTramR);


    setTimeout(prochainTram(line), 700);
}

fetch(urlArret)
    .then(response => {
        if (!response.ok) {
            updateHorairesTram(stopIdA, stopIdR, line)
            throw new Error(`Erreur de chargement du fichier JSON : ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        jsonArrets = data
    })
    .catch(error => {
        updateHorairesTram(stopIdA, stopIdR, line)
        console.error('Erreur lors du chargement du fichier JSON :', error);
    });

updateHorairesTram(stop_Id_A, stop_Id_R, getLine)


function prochainTram(line) {
    let station;
    const jsonDirections = [
        {jsonTram: jsonTramA, horairesId: 'horaires_s1'},
        {jsonTram: jsonTramR, horairesId: 'horaires_s2'}
    ];

    jsonDirections.forEach(direction => {
        const monitoredStopVisits = direction.jsonTram.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
        if (monitoredStopVisits.length > 0) {
            document.getElementById('station').textContent = station = monitoredStopVisits[0].MonitoredVehicleJourney.MonitoredCall.StopPointName[0].value; // Peut-être ajuster si les stations diffèrent par direction
        }
        document.getElementById(direction.horairesId).innerHTML = '';

        monitoredStopVisits.forEach((stopVisit, index) => {
            const monitoredVehicleJourney = stopVisit.MonitoredVehicleJourney;
            const operatorRef = monitoredVehicleJourney.OperatorRef.value;

            let arrivalCountdown;
            if (operatorRef.startsWith("SNCF_ACCES_CLOUD")) {
                let expectedArrivalTimestamp;
                const lineref = monitoredVehicleJourney.LineRef.value;
                const destName = monitoredVehicleJourney.DestinationName[0].value;
                const expectedArrivalTime = monitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;
                const expectedDepartureTime = monitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime;
                const aQuai = monitoredVehicleJourney.MonitoredCall.VehicleAtStop;
                const retard = monitoredVehicleJourney.MonitoredCall.ArrivalStatus;
                let heure_passage;
                let ml = '';
                const now = new Date();
                document.getElementById('station').textContent = station;

                if (destName !== station) {
                    expectedArrivalTimestamp = new Date(expectedDepartureTime).getTime();
                } else {
                    expectedArrivalTimestamp = new Date(expectedArrivalTime).getTime();
                }
                arrivalCountdown = Math.floor((expectedArrivalTimestamp - now) / (1000 * 60));

                if (arrivalCountdown > 59) {
                    const arrivalTime = new Date(expectedArrivalTimestamp);

                    const hours = arrivalTime.getHours();
                    const minutes = arrivalTime.getMinutes();

                    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
                    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

                    ml = `${formattedHours}:${formattedMinutes}`
                }

                if (lineref === "STIF:Line::C02344:" && destName !== station) {
                    if (retard === 'delayed' && aQuai !== true) {
                        heure_passage = "<span class='big-text' style='color:orangered'>Retardé</span>";
                    } else if (arrivalCountdown < 2 && arrivalCountdown > 0) {
                        heure_passage = '<span class="big-text blink" style="color:orange">À l\'approche.</span>';
                    } else if (aQuai === true || arrivalCountdown <= 0) {
                        heure_passage = '<span class="big-text blink" style="color:orangered">À quai</span>';
                    } else if (ml.includes(":")) {
                        heure_passage = "<span class='ultra-text' style='color:orange'>" + ml + '</span><span></span>';
                    } else if (retard === 'early') {
                        heure_passage = "<span class='big-text' style='color:green'>En avance</span>";
                    } else {
                        heure_passage = "<span class='ultra-text' style='color:orange'>" + arrivalCountdown + '</span><span> mins</span>';
                    }
                }

                if (arrivalCountdown > -2 && destName !== station) {
                    const divHoraireRow = document.createElement('div');
                    divHoraireRow.className = 'horaire-row';
                    divHoraireRow.id = 'genHor' + index;

                    const divContainer = document.createElement('div');

                    const h1Dest = document.createElement('h1');
                    h1Dest.className = 'dest';
                    h1Dest.id = 'destination' + index;
                    h1Dest.textContent = destName;

                    const h3Heure = document.createElement('h3');
                    h3Heure.className = 'heure';
                    h3Heure.id = 'heure' + index;
                    h3Heure.innerHTML = heure_passage;

                    divContainer.appendChild(h1Dest);
                    divHoraireRow.appendChild(divContainer);
                    divHoraireRow.appendChild(h3Heure);

                    if (station === ("Saint-Germain-en-Laye" || "Saint-Cyr")) {
                        document.getElementById('horaires_s1').appendChild(divHoraireRow);
                        if (document.getElementById('horaires_s2')) {
                            document.getElementById('horaires_s2').remove()
                        }
                    } else {
                        document.getElementById(direction.horairesId).appendChild(divHoraireRow);
                    }
                } else if (arrivalCountdown < -60) {
                    const divHoraireRow = document.createElement('div');
                    divHoraireRow.className = 'horaire-row';
                    divHoraireRow.id = 'genHor' + index;

                    const h1Dest = document.createElement('h1');
                    h1Dest.className = 'dest';
                    h1Dest.id = 'destination' + index;
                    h1Dest.textContent = "Aucun passage n'est prévu";

                    divHoraireRow.appendChild(h1Dest);

                    document.getElementById('horaires').appendChild(divHoraireRow);
                }
            }

        })
    });
}

function initFlex() {
    let horairesDiv = document.getElementById("horaires_s1");
    if (horairesDiv.children.length > 1) {
        horairesDiv.style.flexDirection = "column";
    }
}


function rechercherStation() {
    const inputValue = document.getElementById('stationSearch').value.toLowerCase();
    const resultsContainer = document.getElementById('stationSearchResults');
    resultsContainer.innerHTML = '';

    let arretsMap = {};

    jsonArrets.forEach(arret => {
        const stopNameLowerCase = arret.stop_name.toLowerCase();
        if (!arretsMap[stopNameLowerCase]) {
            arretsMap[stopNameLowerCase] = {
                stopIds: [],
                stopName: arret.stop_name
            };
        }
        arretsMap[stopNameLowerCase].stopIds.push(arret.stop_id);
    });

    Object.keys(arretsMap).forEach(stopNameLowerCase => {
        if (stopNameLowerCase.includes(inputValue)) {
            const li = document.createElement('li');
            li.textContent = arretsMap[stopNameLowerCase].stopName;

            li.addEventListener('click', () => onStationClick(arretsMap[stopNameLowerCase].stopIds.join(','), arretsMap[stopNameLowerCase].stopName));
            resultsContainer.appendChild(li);
            console.info(stopNameLowerCase);
        }
    });

    if (resultsContainer.children.length > 0) {
        resultsContainer.style.display = 'block';
    } else {
        resultsContainer.style.display = 'none';
    }
}


function onStationClick(stopId, stopName) {
    const stopIds = stopId.split(',');
    console.log(`Stop IDs: ${stopIds.join(', ')}, Stop Name: ${stopName}`);
    document.getElementById('stationSearch').value = stopName;
    document.getElementById('stationSearchResults').style.display = 'none';

    // Appelle updateHorairesTram pour chaque stopId si nécessaire
    stopIds.forEach(id => {
        const extractedId = extractStopId(id.trim());
        updateHorairesTram(extractedId, extractedId);
    });

    const firstStopId = extractStopId(stopIds[0].trim());
    const secStopId = extractStopId(stopIds[1].trim());
    localStorage.setItem("stopIdTram13A", firstStopId);
    localStorage.setItem("stopIdTram13R", secStopId);
    prochainTram(getLine);
}


function extractStopId(stopId) {
    return stopId.split(':').pop();
}

window.onload = function () {
    setTimeout(prochainTram(getLine), 700);
    setTimeout(initFlex, 700);
};

setInterval(updateHorairesTram(stop_Id_A, stop_Id_R, getLine), 19000);
setInterval(prochainTram(getLine), 20000);