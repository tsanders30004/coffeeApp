var express = require('express');
var app = express();
var User = require('./user');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/coffeeDb');

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(bodyParser.json());

/* global variables */

var coffeeOptions = [
     "Extra coarse",
     "Coarse",
     "Medium-coarse",
     "Medium",
     "Medium-fine",
     "Fine",
     "Extra fine"
];

app.get('/', function(request, response){
     response.json(coffeeOptions);
});

app.post('/signup', function(request, response){
     /* need to insert a new record in the datadate. will have to check first if a record exists */
     var credentials = request.body;
     console.log('credentials = ' + credentials);
     console.log('credentials.username = ' + credentials.username);
     console.log('credentials.password = ' + credentials.password);

     /* does the user exist? */
     User.findOne({username: credentials.username }, function(err, res) {
          if (err) {
               console.error(err.message);
               return;
          }
          console.log('res = ', res);  /* res is the corresponding document in the database */

          // console.log('stringify = ' + JSON.stringify(res).username);
          //
          //
          //
          // console.log('--------------------------');
          // console.log(credentials.username);
          // console.log(res.username);
          // console.log('--------------------------');
          //
          // console.log(credentials.username === res.username);
          // console.log(credentials.username + '    '  + res.username);
          if (credentials.username === res.username) {
               console.log('the user name is the same');
               response.json({
                    "status": "fail",
                    "message": "Username is taken"
               });
          }
          // else {
          //      credentials.save(function(err) {
          //           if (err) {
          //                console.error(err.message);
          //                console.error(err.errors);
          //                return;
          //           } else {
          //                res.json({
          //                     "status": "ok"
          //                });
          //           }
          //      });
          //
          //
          // }
     });
});

app.listen(3000, function(){
     console.log('listening on port 3000');
});
