var express = require('express');
var app = express();
var User = require('./user');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');

/* MongoDB Setup */
mongoose.connect('mongodb://localhost/coffeeDb');

/* bcrypt Setup */
const saltRounds = 10;
var myEncryptedPassword = '';


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
var myNewUser;

/* Routes */
app.get('/', function(request, response){
     response.json(coffeeOptions);
});

app.post('/signup', function(request, response){

     console.log('******************************************************************************************************************************');
     var credentials = request.body;
     console.log('credentials = ' + credentials);
     console.log('credentials._id = ' + credentials._id);
     console.log('credentials.password = ' + credentials.password);

     /* does the user already exist in the database? */
     User.findOne({_id: credentials._id }, function(err, res) {
          if (err) {
               console.error(err.message);
               return;
          }
          /* at this point, res is the corresponding document in the database - if there is one */

          if (res === null) {
               /* The requested user was not located in the database.  this is a new user */
               console.log('the requested user [' + credentials._id + '] was not located in the database.  this is a new user');
               /* hash the password */
               bcrypt.genSalt(saltRounds, function(err, salt) {
                    bcrypt.hash(credentials.password, salt, function(err, hash) {
                         if (err) {
                              console.log('an error occurred hashing the password');
                              console.error(err.message);
                              return;
                         }
                         /* Store hash in your password DB. */
                         console.log('the encrypted password is [' + hash + '].');
                         myNewUser = new User({
                              _id:                credentials._id,
                              encryptedPassword:  hash
                         });
                         myNewUser.save(function(err){
                              if(err) {
                                   console.log('there was an error creating the new user in the database');
                                   console.error(err.message);
                                   return;
                              }
                              console.log('the user was created successfully in the database');
                         });
                    });
               });

          } else if (credentials._id === res._id) {
               /* The requested user already exists in the database */
               console.log('the requested username [' + credentials._id + '] already exists');
               response.json({
                    "status": "fail",
                    "message": "username already taken"
               });
          } else {
               /* There is some other error. */
               console.log('there is some other error.  need to return some kind of error code');
          }

          // if (credentials._id === res._id) {
          //      console.log('the requested _id [' + credentials._id + '] already exists');
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
