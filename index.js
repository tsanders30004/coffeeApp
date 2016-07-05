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

     console.log('*******************************************************************************************************************************************');
     var credentials = request.body;
     console.log('credentials = ' + credentials);
     console.log('credentials.username = ' + credentials.username);
     console.log('credentials.password = ' + credentials.password);

     /* does the user already exist in the database? */
     User.findOne({username: credentials.username }, function(err, res) {
          if (err) {
               console.error(err.message);
               return;
          }
          /* at this point, res is the corresponding document in the database - if there is one */

          if (res === null) {
               console.log('the requested user was not located in the database.  this is a new user');
          } else if (credentials.username === res.username) {
               console.log('the requested username [' + credentials.username + '] already exists');
               response.json({
                    "status": "fail",
                    "message": "username already taken"
               });
          } else {
               console.log('there is some other error.  need to return some kind of error code');
          }

          // if (credentials.username === res.username) {
          //      console.log('the requested username [' + credentials.username + '] already exists');
          //      response.json({
          //           "status": "fail",
          //           "message": "username already taken"
          //      });
          // }
          // else {
          //      console.log(credentials);
               // console.log('creating a new user with username [' + response.username + '] and password [' + response.password + ']');
               // credentials.save(function(err) {
               //      if (err) {
               //           console.error(err.message);
               //           console.error(err.errors);
               //           return;
               //      } else {
               //           res.json({
               //                "status": "ok"
               //           });
               //      }
               // });
          // }
     });
});

app.listen(3000, function(){
     console.log('listening on port 3000');
});
