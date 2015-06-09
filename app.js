//dependencies for each module used
var express = require('express');
var findOrCreate = require('mongoose-findorcreate')
var Zillow = require('node-zillow');
var http = require('http');
var path = require('path');
var dotenv = require('dotenv');
var mongoose = require('mongoose');
var handlebars = require('express3-handlebars');
var pg = require('pg');
var app = express();



var index = require('./routes/index');
var zillow = new Zillow("X1-ZWz1a7ra6xs5qj_7rj5m");



mongoose.connect('mongodb://nilumbra:chenhuaxiao89@ds043012.mongolab.com:43012/cogs121');
var db = mongoose.connection;
db.on('error',function(e){
    console.log("Error: " +  "\n" + e.message);
    console.log( e.stack );
});
db.once('open', function (callback) {
    console.log("Database connected succesfully.");
});

var Schema = mongoose.Schema;
//GetSearchResults - Params: address, city/state/zip || result: Zpid, and lots more...........use getDeepSearchResults for more info

//GetComps - params: Zpid, count(1-25), rentzestimate(bool) || result: set of infos for comparables...............use deep for more results

//GetDemographics - params: regionid or zip or state or city or neighborhood || charts and info

//GetRateSummary - mortgage rates by state

//GetMonthlyPayments - calculator - http://www.zillow.com/howto/api/GetMonthlyPayments.htm

app.get('/getDeepSearchResults', function(req, res) {

    var address = req.query.address;
    //console.log("address: "+address);

    var street = address.substring(0, address.indexOf(","));
    address = address.substring(address.indexOf(",")+2);

    //A chance that we get a range here
    var streetNum = street.substring(0, street.indexOf(" "));
    if(streetNum.indexOf('-') != -1){
        var minRange = streetNum.substring(0, streetNum.indexOf('-'));
        var maxRange = streetNum.substring(streetNum.indexOf('-')+1);

        //console.log("minRange: "+minRange)
        //console.log("maxRange: "+maxRange)
        //Randomize in between?
        //Just give maxRange for now
        street = maxRange+""+street.substring(street.indexOf(" "))
    }
    //console.log("street: "+street)

    var city = address.substring(0, address.indexOf(","));
    address = address.substring(address.indexOf(",")+2);
    //console.log("city: "+city);

    var state = address.substring(0, address.indexOf(" "));
    address = address.substring(address.indexOf(" ")+1);
    //console.log("state: "+state);

    var zip = address.substring(0, address.indexOf(","));
    //console.log("zip: "+zip);

    var getSearchParams = {
        address: street,
        city: city,
        state: state,
        zip: zip
    }

    zillow.getDeepSearchResults(getSearchParams)
        .then(function(result) {

            if(result.message[0].code == 0){
                console.log("in here: "+JSON.stringify(result.response[0]));
                //console.log("latitude "+JSON.stringify(result.response[0].results[0].result[0].address[0].latitude[0]));
                //console.log("longitude "+JSON.stringify(result.response[0].results[0].result[0].address[0].longitude[0]));
                var zpid = result.response[0].results[0].result[0].zpid[0]
                res.send(result.response[0]);
                return; //zillow.getUpdatedPropertyDetails(zpid);

            }else{
                console.log("Cant get that address: "+req.query.address);
                //console.log("error code: "+JSON.stringify(result.message[0].code)); //0 = success
                res.send("error getting location");
                return;
            }

        });

    //res.send(result.response[0]);
});




app.get('/getCompResults', function(req, res) {

    var zpid = req.query.zpid;
    console.log("In comp function: "+zpid);
    var getCompParams = {
        zpid: zpid,
        count: 25,
        rentzestimate: true
    };

     zillow.callApi('GetComps', getCompParams)
     .then(function(data) {
     console.log("in comps here: "+JSON.stringify(data));
     //var results = data.response[0].results[0].result[0];
     //return results;
     res.send("hello comp world"+data.response[0]);
     return;
     });


});



var HouseInfoSchema2 = new Schema({
    zpid: Number,
    url : String,
    beds: String,
    baths: String,
    sqft: String,
    address: String,
    rental: String,
    zestimate: String,
    longitude: String,
    latitude: String,
    state: String,
    zipcode: String,
    comparables: String,
    mapthishome: String
});


var HouseInfo2 = mongoose.model('houseinfos2',HouseInfoSchema2);




app.get('/getHousesInRentalRange', function (req, res) {

    console.log("minRange:"+req.query.minRange);
    console.log("minRange:"+req.query.maxRange);
    var upper = req.query.maxRange;
    var lower = req.query.minRange;



    var query= HouseInfo2.where('rental')
        .regex(/[^-]/g)
        .gte(lower.toString())
        .lte(upper.toString())
        .sort('rental')
        .exec(function(err, data){
            if(err)
                console.log(err);
            else {
                console.log("DB results: "+data.length);
                res.send(data);
            }
            return;
        });
    //return query; //get rid of comment when actually put into use
    //var regionsFromJson = require('./public/json/sd-regions.json');


});



/*
function getResults(){

    HouseInfo2.find().limit(10).exec(function(err,data2){
        if(err)
            console.log(err)
        else
            console.log(data2);})


}*/

app.get('/showMapRegions', function (req, res) {
    var regionsFromJson = require('./public/json/sd-regions.json');
    res.send(regionsFromJson);

});

app.get('/readMedianData', function (req, res) {
    var dataFromJson = require('./public/json/median-sold-price-july-2005-2015-san-diego.json');
    res.send(dataFromJson);

});

app.get('/readMaritalStatus', function (req, res) {
    var dataFromJson = require('./public/json/marital_status.json');
    res.send(dataFromJson);

});


app.get('/readAgeStats', function (req, res) {
    var dataFromJson = require('./public/json/demo_age_2012.json');
    res.send(dataFromJson);

});


app.get('/delphidata', function (req, res) {


    //hhsa_san_diego_demographics_home_value_2012
    //cdph_smoking_prevalence_in_adults_1984_2013
    //caltrans_1_hour
    //zillow_zip_median_sold_price_per_sqft_all_homes_norm

    var conString = "postgres://cogsci_121_1:Lj9vQnwMVikW@delphidata.ucsd.edu/delphibetadb";

    pg.connect(conString, function(err, client, done) {
        if(err) return console.log(err);
        console.log("connected to DB");
        //var query = 'SELECT * FROM zillow_zip_median_sold_price_per_sqft_all_homes_norm WHERE State = CA AND City = San Diego';

        var query = 'SELECT time FROM caltrans_1_hour WHERE avgspeed = 60';
        //var query = "SELECT * FROM zillow_zip_median_sold_price_per_sqft_all_homes_norm LIMIT 100";//WHERE 'State'='CA'"; // 'State' = 'CA' AND
        //var query = 'SELECT * FROM hhsa_san_diego_demographics_home_value_2012';
        client.query(query, function(err, result) {
            // return the client to the connection pool for other requests to reuse
            console.log("back from DB: "+JSON.stringify(result));
            done();

            //res.writeHead("200", {'content-type': 'application/json'});
            //res.send(JSON.stringify(result.rows));
        });
    });

});





//Configures the Template engine
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

//routes
app.get('/', function(req, res){
  res.render('index');
});
app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

//set environment ports and start application
app.set('port', 3000);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;

