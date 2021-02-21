// require statements (importing packages)
let express = require('express');
const cors = require('cors');
// initializations and configuration
let app = express();
app.use(cors());
require('dotenv').config();
const PORT = process.env.PORT;


app.get("/location", handileLocation);
app.get("/weather", handiwether);

function handileLocation(req, res) {
    let searchQuery = req.query.city;
    let locationObject = getLocationData(searchQuery);
    res.status(200).send(locationObject);
}

function handiwether(req, res) {

    let WetheronObject = getWetherData();
    res.status(200).send(WetheronObject);
}

function getLocationData(searchQuery) {
    let loctionData = require("./data/location.json");
    let lengtiued = loctionData[0].lon;
    let latitued = loctionData[0].lat;
    let displayName = loctionData[0].display_name;
    let newCity = new CityLocation(searchQuery, displayName, latitued, lengtiued);
    return newCity;
}

function CityLocation(search_query, display_name, latitude, longitude) {

    this.search_query = search_query;
    this.formatted_query = display_name;
    this.latitude = latitude;
    this.longitude = longitude;

}


function getWetherData() {
    let wetherData = require("./data/wether.json");
    let myArray = [];
    let dataOne = wetherData.data;


    for (let i = 0; i < dataOne.length; i++) {
        let myWetherDes = dataOne[i].weather.description;
        let timeOne = dataOne[i].valid_date;
        var d = new Date(timeOne);
        let dd = d.toDateString()
        let newWether = new CityWether(myWetherDes, dd);
        myArray.push(newWether);


    }
    return myArray;
}



function CityWether(forecast, time) {

    this.forecast = forecast;
    this.time = time;



}


app.listen(PORT, () => {
    console.log('the app is listening on port ' + PORT);
});