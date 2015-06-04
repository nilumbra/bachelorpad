//dependencies for each module used
var express = require('express');
var Zillow = require('node-zillow');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars');
var app = express();


var index = require('./routes/index');
var zillow = new Zillow("X1-ZWz1a7ra6xs5qj_7rj5m");


var parameters = {
    zpid: 1111111
};


//GetSearchResults - Params: address, city/state/zip || result: Zpid, and lots more...........use getDeepSearchResults for more info

//GetComps - params: Zpid, count(1-25), rentzestimate(bool) || result: set of infos for comparables...............use deep for more results

//GetDemographics - params: regionid or zip or state or city or neighborhood || charts and info

//GetRateSummary - mortgage rates by state

//GetMonthlyPayments - calculator - http://www.zillow.com/howto/api/GetMonthlyPayments.htm

app.get('/getDeepSearchResults', function(req, res) {

    var address = req.query.address;
    console.log("address: "+address);

    var street = address.substring(0, address.indexOf(","));
    address = address.substring(address.indexOf(",")+2);
    console.log("street: "+street);
    //A chance that we get a range here.






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
            console.log("error code: "+JSON.stringify(result.message[0].code));


            console.log("in here: "+JSON.stringify(result.response[0]));
            var zpid = result.response[0].results[0].result[0].zpid[0]
            return zillow.getUpdatedPropertyDetails(zpid)
        })

    res.send('hello world');
});



app.get('/getCompResults', function(req, res) {


    var getSearchParams = {
        zpid: 16834453
    }

     //GetZestimate
     zillow.callApi('GetComps', params)
     .then(function(data) {
     console.log("in here: "+JSON.stringify(data.response[0]));
     //var results = data.response[0].results[0].result[0];
     console.log("done here:");
     return results;
     })

    res.send('hello world');
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

