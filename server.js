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
app.get("/parks", hadleParks);
app.get("/movies", handlemovie);
app.get("/yelp",handleyeld)
app.get("*", handale404)

/////**handelar*****///////
function handleyeld(req,res){

    try{
        let searchQuery = req.query.search_query;
        let page = req.query.page;
        // console.log('Wroks', searchQuery, page);
        getyelpData(searchQuery,page,res);
    }
        catch (error){
            res.status(500).send("sorry we didint find what you want" + error);
        }

}
function handlemovie(req, res) {
    try{
    let searchQuery = req.query.search_query;
    getMovieData(searchQuery, res);
}
    catch (error){
        res.status(500).send("sorry we didint find what you want" + error);
    }
}
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
function handale404(req,res) {
    res.status(404).send("sorry we hava no this what you search about")
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

function getyelpData(searchQuery,page,res){
let url="https://api.yelp.com/v3/businesses/search";

let x=0+(page*5);

const query={
    term:"restaurants",
    location:searchQuery,
    limit:5,
    offset:x
}

const key = { Authorization: `Bearer Jmm4r6tlZmuk88qjofQG6dhX35yABqi69xih5oTigQfKIE8AXXCTpv8ljwIHMKfE0i2p_g1RmahMLcurc2jAY4bczZzc6PU6hUZ6rNTBQAfiLKRBLf4oG7A1RDo2YHYx`};

superagen.get(url).set(key).query(query).then(yelpData =>{
// console.log(yelpData.body.businesses);
    let myData=yelpData.body.businesses;
let myNewArray=[];
    for (let i=0;i<myData.length;i++){
let name=myData[i].name;
let image_url=myData[i].image_url;
let price=myData[i].price;
let rating=myData[i].price;
let url=myData[i].url;
let myYeldObject= new Yeld(name,image_url,price,rating,url)
myNewArray.push(myYeldObject);

}
res.status(200).send(myNewArray);
}).catch(error=>{
    console.log('This is the erroe=r',error);
})
}
function getMovieData(searchQuery, res) {
    let url = `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&api_key=99bcbe2798fe9f5139dfe375fc95712e`
    
   
    superagen.get(url).then(movieedata => {
   
        let myArray = [];
        let dataOne = movieedata.body.results;
        for (let i = 0; i<dataOne.length; i++) {
            let mytitle = dataOne[i].title;
            let overView = dataOne[i].overview;
            let average_votes = dataOne[i].vote_average;
            let total_votes = dataOne[i].vote_count;
            let imageDisplay='https://image.tmdb.org/t/p/w500' +dataOne[i].poster_path;
            let popularity = dataOne[i].popularity;
            let released_on = dataOne[i].release_date;
            let myObject = new Movie(mytitle, overView, average_votes, total_votes, imageDisplay, popularity, released_on);
            myArray.push(myObject);
        }

        res.status(200).send(myArray);
    }).catch((error) => {
        res.status(500).send("sorry you have problem in movie");
    })
}

function getParksData(searchQuery, res) {
    let url = `https://developer.nps.gov/api/v1/parks?q=${searchQuery}&api_key=HtU0uoasP01EbkVkZZoVCRDDIcTzdsaPmRXeIB0h`
    superagen.get(url).then((value) => {
        let myNewArray = value.body.data.map(parksData => {
            return new Park(parksData.fullName, Object.values(parksData.addresses[0]).join(' '), 0, parksData.description, parksData.url);
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
            // console.log(data.rows[0]);
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

function Yeld(a,b,c,d,e){
this.name=a;
this.image_url=b;
this.price=c;
this.rating=d;
this.url=e;

}
function Movie(a, b, c, d, e, f, g) {
    this.title = a;
    this.overview = b;
    this.average_votes = c;
    this.total_votes = d;
    this.image_url = e;
    this.popularity = f;
    this.released_on = g;
}

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