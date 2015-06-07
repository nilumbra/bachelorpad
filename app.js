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


//var models = require('./models');

//var dbConnect = DATABASE_CONNECTION_URL="postgres://USERNAME:PASSWORD@HOST/caltrans_1_hour";



mongoose.connect('mongodb://localhost/bachelorpad');
var db = mongoose.connection;
db.on('error',function(e){
    console.log("Error: " +  "\n" + e.message);
    console.log( e.stack );
});
db.once('open', function (callback) {
    console.log("Database connected succesfully.");
});


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

    /*
    var getSearchParams = {
        address: "9450 La Jolla Farms Road",
        city: "La Jolla",
        state: 'CA',
        zip: '92037'
    }*/

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
                return;
            }

        });

    //res.send(result.response[0]);
});


//TODO
app.get('/getCompResults', function(req, res) {

    var address = req.query.zpid;
    //var getSearchParams = {
    //    zpid: 16834453
    //}

     //GetZestimate
     zillow.callApi('GetComps', params)
     .then(function(data) {
     console.log("in here: "+JSON.stringify(data.response[0]));
     //var results = data.response[0].results[0].result[0];
     return results;
     });

    res.send("hello world"+results);
});





//TODO Save all google places and Zillow houses to DB
app.get('/saveResults', function(req, res) {

    console.log("input: "+JSON.stringify(req.data));
    //var thisBar = barSchema;
    //thisBar.plugin(findOrCreate);
    //var FindOrCreateBar = mongoose.model('Bar', thisBar);

    //bar.plugin(findOrCreate);
    //var Click = mongoose.model('Bar', barSchema);
/*
    FindOrCreateBar.findOrCreate({data: '127.0.0.1'}, function(err, click, created) {
        // created will be true here
        console.log('A new click from "%s" was inserted', click.ip);
        FindOrCreateBar.findOrCreate({}, function(err, click, created) {
            // created will be false here
            console.log('Did not create a new click for "%s"', click.ip);
        })
    });
*/

    res.send('hello world');
});





var houseSchema = mongoose.Schema({
    data: Object
})

var barSchema = mongoose.Schema({
    data: Object
})



app.get('/showMapRegions', function (req, res) {
    var regionsFromJson = require('./public/json/ca-counties.json');
    res.send(regionsFromJson);

});



app.get('/delphidata', function (req, res) {


    //hhsa_san_diego_demographics_home_value_2012
    //cdph_smoking_prevalence_in_adults_1984_2013

    var conString = "postgres://cogsci_121_1:Lj9vQnwMVikW@delphidata.ucsd.edu/delphibetadb";

    pg.connect(conString, function(err, client, done) {
        if(err) return console.log(err);
        console.log("connected to DB");
        var query = 'SELECT * FROM hhsa_san_diego_demographics_home_value_2012';
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
app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;

