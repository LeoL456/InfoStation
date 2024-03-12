let jsonResponse;
let jsonArrets;
let LigneInfo;
let stop_Id;
let dir_Tram;

let jsonLignes = {
    "tram": {
        "13": {
            "code": "C02344",
            "arretsIndex": "arrets-tram-13-",
            "icon": "tram-13.svg"
        }
    }
};

if (localStorage.getItem("stop_id_tram") !== null && localStorage.getItem("stop_id_tram") !== undefined) {
    stop_Id = localStorage.getItem("stop_id_tram");
}

function updateHorairesv2(stopId, line = "1") {
    if (localStorage.getItem("dir_tram") !== null && localStorage.getItem("dir_tram") !== undefined) {
        dir_Tram = localStorage.getItem("dir_tram");
    }

    LigneInfo = jsonLignes.tram[line];
    const urlArret = "json/tram/" + LigneInfo.arretsIndex + getDir + ".json";
    localStorage.setItem("dir_tram", getDir);

    fetch(urlArret)
        .then(response => {
            if (!response.ok) {
                //updateHorairesv2(stopId, getLine)
                throw new Error(`Erreur de chargement du fichier JSON : ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            jsonArrets = data
            jsonArrets.sort((a, b) => a.stop_name.localeCompare(b.stop_name));
        })
        .catch(error => {
            //updateHorairesv2(stopId, getLine)
            console.error('Erreur lors du chargement du fichier JSON :', error);
        });

    setTimeout(function () {
        prochainTrain(String(LigneInfo.code));
    }, 700);


    const url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring';

    const headers = {
        'Accept': 'application/json',
        'apikey': "SA2gwXmU8tMANuVvb1cei7oQc3FjEGOQ"
    };

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${url}?MonitoringRef=STIF:StopPoint:Q:` + stopId + `:`, true);

    for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
        }
    }

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            jsonResponse = JSON.parse(xhr.responseText);
        }
    };
    xhr.send();


    let image = document.getElementById('icon');

    console.log(LigneInfo.icon)
    if (image && LigneInfo && LigneInfo.icon) {
        image.src = "./img/lignes/" + LigneInfo.icon;
    }
}

function prochainTrain(ligne = "A") {
    const monitoredStopVisits = jsonResponse.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
    let previousDirection = null;
    let directionCounter = 1;

    document.getElementById('horaires').innerHTML = '';
    monitoredStopVisits.forEach((stopVisit, index) => {
        const monitoredVehicleJourney = stopVisit.MonitoredVehicleJourney;
        const operatorRef = monitoredVehicleJourney.OperatorRef.value;
        if (operatorRef.startsWith("SNCF_ACCES_CLOUD")) {
            let expectedArrivalTimestamp;
            const lineref = monitoredVehicleJourney.LineRef.value;
            const directionName = 0;
            let destName = monitoredVehicleJourney.DestinationName[0].value;
            const expectedArrivalTime = monitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;
            const expectedDepartureTime = monitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime;
            let station = monitoredVehicleJourney.MonitoredCall.StopPointName[0].value;
            const aQuai = monitoredVehicleJourney.MonitoredCall.VehicleAtStop;
            const retard = monitoredVehicleJourney.MonitoredCall.DepartureStatus;
            const now = new Date();
            let ml = '';

            if (destName !== station) {
                expectedArrivalTimestamp = new Date(expectedDepartureTime).getTime();
            } else {
                expectedArrivalTimestamp = new Date(expectedArrivalTime).getTime();
            }
            const arrivalCountdown = Math.floor((expectedArrivalTimestamp - now) / (1000 * 60));
            if (arrivalCountdown > 59) {
                const arrivalTime = new Date(expectedArrivalTimestamp);

                const hours = arrivalTime.getHours();
                const minutes = arrivalTime.getMinutes();

                const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
                const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

                ml = `${formattedHours}:${formattedMinutes}`
            }

            if (station.startsWith("Gare de l'")) {
                station = station.replace("Gare de l'", "Paris ");
            } else if (station.startsWith("Gare de ")) {
                station = station.replace("Gare de ", "");
            } else if (station.startsWith("Gare d'")) {
                station = station.replace("Gare d'", "");
            } else if (station.startsWith("Gare des")) {
                station = station.replace("Gare des", "Les");
            } else if (station.startsWith("Gare du V")) {
                station = station.replace("Gare du V", "Le V");
            } else if (station.startsWith("Gare du R")) {
                station = station.replace("Gare du R", "Le R");
            } else if (station.startsWith("Gare du")) {
                station = station.replace("Gare du", "Paris");
            }
            if (destName.startsWith("Gare de l'")) {
                destName = destName.replace("Gare de l'", "Paris ");
            } else if (destName.startsWith("Gare de ")) {
                destName = destName.replace("Gare de ", "");
            } else if (destName.startsWith("Gare du")) {
                destName = destName.replace("Gare du", "Paris ");
            } else if (destName.startsWith("Gare des")) {
                destName = destName.replace("Gare des", "Les");
            } else if (destName.startsWith("Gare d'")) {
                destName = destName.replace("Gare d'", "");
            }

            let heure_passage = '';
            document.title = station + " - Tram " + getLine;


            if (directionName !== previousDirection) {
                if (lineref === "STIF:Line::" + ligne + ":" && operatorRef.startsWith("SNCF_ACCES_CLOUD") && destName !== station) {
                    const h3Direction = document.createElement('h3');
                    h3Direction.textContent = `Direction : ${directionName}`;
                    document.getElementById('horaires').appendChild(h3Direction);

                    const newDivHoraires = document.createElement('div');
                    newDivHoraires.id = 'horaires' + directionCounter;
                    directionCounter++;

                    previousDirection = directionName;

                    document.getElementById('horaires').appendChild(newDivHoraires);
                }
            }


            if (lineref === "STIF:Line::" + ligne + ":" && destName !== station) {
                if (retard === 'delayed' || arrivalCountdown < -2 && arrivalCountdown > -4) {
                    heure_passage = "<span class='big-text' style='color:orangered'>RetardÃ©</span>";
                } else if (arrivalCountdown < 2 && arrivalCountdown > 0) {
                    heure_passage = '<span class="big-text blink" style="color:orange">À l\'approche.</span>';
                } else if (aQuai === true || arrivalCountdown === 0 || arrivalCountdown <= -1) {
                    heure_passage = '<span class="big-text blink" style="color:orangered">À quai</span>';
                } else if (ml.includes(":")) {
                    heure_passage = "<span class='ultra-text' style='color:orange'>" + ml + '</span><span></span>';
                } else if (retard === 'early') {
                    heure_passage = "<span class='big-text' style='color:green'>En avance</span>";
                } else {
                    heure_passage = "<span class='ultra-text' style='color:orange'>" + arrivalCountdown + '</span><span> mins</span>';
                }

                if (arrivalCountdown >= 0) {
                    let h3quai;
                    const divHoraireRow = document.createElement('div');
                    divHoraireRow.className = 'horaire-row';
                    divHoraireRow.id = 'genHor' + index;

                    const divContainer = document.createElement('div');
                    divContainer.style.marginTop = '1rem';

                    const subtitleDiv = document.createElement('div');
                    subtitleDiv.className = 'horaire-sub';

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

                    document.getElementById('horaires' + (directionCounter - 1)).appendChild(divHoraireRow);
                    document.getElementById('station').textContent = station;
                    document.getElementById('horaires1').style.width = "100vw"
                }
            }
        }
        if (operatorRef.startsWith("RATP-SIV:Operator")) {
            const lineref = monitoredVehicleJourney.LineRef.value;
            const directionName = monitoredVehicleJourney.DirectionName[0].value;
            let destName = monitoredVehicleJourney.DestinationName[0].value;
            const expectedArrivalTime = monitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;
            const expectedDepartureTime = monitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime;
            const station = monitoredVehicleJourney.MonitoredCall.StopPointName[0].value;
            const aQuai = monitoredVehicleJourney.MonitoredCall.VehicleAtStop;
            const retard = monitoredVehicleJourney.MonitoredCall.DepartureStatus;
            const expectedArrivalTimestamp = new Date(expectedArrivalTime).getTime();
            const expectedDepartureTimestamp = new Date(expectedDepartureTime).getTime();
            const now = new Date();
            const arrivalCountdown = Math.floor((expectedArrivalTimestamp - now) / (1000 * 60));
            const departureCountdown = Math.floor((expectedDepartureTimestamp - now) / (1000 * 60));
            let ml = '';
            let heure_passage = '';
            if (arrivalCountdown > 59) {
                const arrivalTime = new Date(expectedArrivalTimestamp);

                const hours = arrivalTime.getHours();
                const minutes = arrivalTime.getMinutes();

                const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
                const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

                ml = `${formattedHours}:${formattedMinutes}`
            }
            if (directionName !== previousDirection) {
                if (lineref === "STIF:Line::" + ligne + ":" && operatorRef.startsWith("RATP-SIV:Operator") && destName !== station) {
                    const h3Direction = document.createElement('h3');
                    h3Direction.textContent = `Direction : ${directionName}`;


                    const newDivHoraires = document.createElement('div');
                    newDivHoraires.id = 'horaires' + directionCounter;
                    directionCounter++;

                    previousDirection = directionName;
                    newDivHoraires.appendChild(h3Direction);
                    document.getElementById('horaires').appendChild(newDivHoraires);
                }
            }

            if (destName.startsWith("Aéroport Charles de Gaulle 2 (Terminal 2)")) {
                destName = destName.replace("Aéroport Charles de Gaulle 2 (Terminal 2)", "Aéroport CDG 2 TGV");
            }

            document.title = station + " - Tram " + getLine;

            if (lineref === "STIF:Line::" + ligne + ":" && operatorRef.startsWith("RATP-SIV:Operator") && destName !== station) {
                if (aQuai === true || departureCountdown === 0 || departureCountdown <= -1) {
                    heure_passage = '<span class="big-text blink" style="color:orangered">À Quai</span>';
                } else if (arrivalCountdown <= 1) {
                    heure_passage = '<span class="big-text blink" style="color:orange">À l\'approche.</span>';
                } else if (retard === 'delayed') {
                    heure_passage = "<span class='big-text' style='color:orangered'>Retardé</span>";
                } else if (ml.includes(":")) {
                    heure_passage = "<span class='ultra-text' style='color:orange'>" + ml + '</span><span></span>';
                } else if (retard === 'early') {
                    heure_passage = "<span class='big-text' style='color:green'>En avance</span>";
                } else if (isNaN(departureCountdown)) {
                    heure_passage = "<span class='ultra-text' style='color:orange'>" + arrivalCountdown + '</span><span> mins</span>';
                } else {
                    heure_passage = "<span class='ultra-text' style='color:orange'>" + departureCountdown + '</span><span> mins</span>';
                }

                const divHoraireRow = document.createElement('div');
                divHoraireRow.className = 'horaire-row';
                divHoraireRow.id = 'genHor' + index;

                const divContainer = document.createElement('div');
                divContainer.style.marginTop = '1rem';

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

                document.getElementById('horaires' + (directionCounter - 1)).appendChild(divHoraireRow);
                document.getElementById('station').textContent = station;
            }
        }
    });

    let horairesDiv = document.getElementById("horaires");
    if (horairesDiv.children.length === 1) {
        horairesDiv.firstChild.style.width = "100%";
    }
}

function newStation() {
    document.getElementById('horaires').innerHTML = ''
    document.getElementById('horaires').innerHTML = "<h3>Choisissez une station.</h3>"
}

function rechercherStation() {
    const inputValue = document.getElementById('stationSearch').value.toLowerCase();
    const resultsContainer = document.getElementById('stationSearchResults');
    resultsContainer.innerHTML = '';

    jsonArrets.forEach(arret => {
        const stopNameLowerCase = arret.stop_name.toLowerCase();
        if (stopNameLowerCase.includes(inputValue)) {
            const li = document.createElement('li');
            li.textContent = arret.stop_name;
            li.addEventListener('click', () => onStationClick(arret.stop_id, arret.stop_name));
            resultsContainer.appendChild(li);
        }
    });

    if (resultsContainer.children.length > 0) {
        resultsContainer.style.display = 'block';
    } else {
        resultsContainer.style.display = 'none';
    }
}

function onStationClick(stopId, stopName) {
    console.log(`Stop ID: ${extractStopId(stopId)}, Stop Name: ${stopName}`);
    document.getElementById('stationSearch').value = stopName;
    document.getElementById('stationSearchResults').style.display = 'none';
    updateHorairesv2(extractStopId(stopId), getLine);
    stop_Id = extractStopId(stopId);
    localStorage.setItem("stop_id_tram", extractStopId(stopId))
    prochainTrain()
}

function extractStopId(stopId) {
    return stopId.split(':').pop();
}

window.onload = function () {
    verifierConnexion();
    setInterval(verifierConnexion, 1000);
};

let intervalUpdateHoraires;
let intervalProchainTrain;

function verifierConnexion() {
    if (navigator.onLine) {
        document.getElementById('icone-wifi').style.display = 'none';
        if (!intervalUpdateHoraires) {
            intervalUpdateHoraires = setInterval(function () {
                updateHorairesv2(stop_Id, getLine);
            }, 19000);
        }
        if (!intervalProchainTrain) {
            prochainTrain(getLine);
            intervalProchainTrain = setInterval(prochainTrain(getLine), 20000);
        }
    } else {
        document.getElementById('icone-wifi').style.display = 'block';
        document.getElementById('horaires').innerHTML = '';
        clearInterval(intervalUpdateHoraires);
        clearInterval(intervalProchainTrain);
        intervalUpdateHoraires = null;
        intervalProchainTrain = null;
    }
}