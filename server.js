// require statements (importing packages)
require('dotenv').config();
let express = require('express');
const cors = require('cors');

// initializations and configuration
let app = express();
let superagen = require('superagent')
const pg = require("pg")
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

const client = new pg.Client(process.env.Database_url);
app.use(cors());

const PORT = process.env.PORT;

//////******routs********///////
app.get("/location", handileLocation);
app.get("/weather", handiwether);
app.get("/parks", hadleParks)
app.get("*", handale404)


/////**handelar*****///////
function handileLocation(req, res) {
    try {
        let searchQuery = req.query.city;
        getLocationData(searchQuery, res);
    }
    catch (error) {
        res.status(500).send("sorry we didint find what you want" + error);
    }
}
function handiwether(req, res) {
    try {
        let searchQuery = req.query.search_query;
        getWetherData(searchQuery, res);

    } catch (error) {
        res.status(500).send("sorry we didint find what you want" + error);
    }
}
function handale404(res, req) {
    req.status(404).send("sorry we hava no this what you search about")
}
function hadleParks(req, res) {
    try {
        let searchQuery = req.query.search_query;
        getParksData(searchQuery, res);
    } catch (error) {
        res.status(500).send("sorry we didint find what you want" + error);
    }
}
///////////////********functioss******///////////


/////////gettter/////////
function getParksData(searchQuery, res) {
    let url = `https://developer.nps.gov/api/v1/parks?q=${searchQuery}&api_key=HtU0uoasP01EbkVkZZoVCRDDIcTzdsaPmRXeIB0h`
    superagen.get(url).then((value) => {
        let myNewArray = value.body.data.map(parksData => {
            return new Park(parksData.fullName,Object.values(parksData.addresses[0]).join(' '), 0, parksData.description, parksData.url);
        });
        res.status(200).send(myNewArray);
    })
}
function getLocationData(searchQuery, res) {
    let dbQuery = `select * from locations where search_query='${searchQuery}'`
    client.query(dbQuery).then(data => {
        if (data.rows.length == 0) {
            let url = `https://us1.locationiq.com/v1/search.php?key=pk.33db728ed74f7615e08c46253c36419a&limit=1&q=${searchQuery}&format=json`;
            superagen.get(url).then(data => {
                let lengtiued = data.body[0].lon;
                let latitued = data.body[0].lat;
                let displayName = data.body[0].display_name;
                let newCity = new CityLocation(searchQuery, displayName, latitued, lengtiued);
                res.status(200).send(newCity);
                let myInsert = `INSERT INTO locations(search_query,latitude,longitude) VALUES ('${searchQuery}',${latitued},${lengtiued})`;
                client.query(myInsert).then(data => {
                    console.log("successful inserted")
                });
            });
        }// if
        else {
            console.log(data.rows[0]);
            res.status(200).send(data.rows[0]);
        }
    }).catch(error => {
        console.log('an error occurred ' + error);
    });
}
function getWetherData(searchQuery, res) {
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${searchQuery}&key=895cc577cb0c4e17ae61fb0db04c4eeb`;
    superagen.get(url).then(weathedata => {
        let myArray = [];
        let dataOne = weathedata.body.data;
        for (let i = 0; i < dataOne.length; i++) {
            let myWetherDes = dataOne[i].weather.description;
            let timeOne = dataOne[i].valid_date;
            var d = new Date(timeOne);
            let dd = d.toDateString();
            let newWether = new CityWether(myWetherDes, dd);
            myArray.push(newWether);
        }
        res.status(200).send(myArray);
    }).catch((eroor) => {
        res.status(500).send("sorry you have problem in weather");
    })
}

//////////*****conesrttot****///////
function Park(a, b, c, d, e) {
    this.name = a;
    this.address = b;
    this.fee = c;
    this.description = d;
    this.url = e;
}

function CityLocation(searchQuery, displayName, latitued, lengtiued) {
    this.search_query = searchQuery;
    this.formatted_query = displayName;
    this.latitude = latitued;
    this.longitude = lengtiued;
}

function CityWether(forecast, time) {
    this.forecast = forecast;
    this.time = time;
}
///////start server listen to the bored /////
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('the app is listening to port ' + PORT);
    });
}).catch(error => {
    console.log('an error occurred while connecting to database ' + error);
});