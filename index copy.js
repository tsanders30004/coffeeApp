var express = require('express');
var app = express();
var User = require('./user');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var randomtoken = require('rand-token');     /* https://www.npmjs.com/package/rand-token */

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
               response.send('ok');     /* postman will lock up unless you issue a response somewhere in this function */

          } else if (credentials._id === res._id) {
               /* The requested user already exists in the database */
               console.log('the requested username [' + credentials._id + '] already exists');
               console.log('***** CONFIRM THAT WE ARE RETURNING THE CORRECT ERROR CODES *****');
               response.status(409);
               response.json({
                    "status": "fail",
                    "message": "username already taken"
               });
               return;
          } else {
               /* There is some other error. */
               console.log('there is some other error.  need to return some kind of error code');
          }
     });
});

app.post('/login', function(request, response){
     /* local variables */
     var uid = '';       /*   used by rand-token */
     var token = '';     /*   used by rand-token */

     /* step 1: fetch the user's record from the database */
     var credentials = request.body;
     response.send('ok');

     User.findOne({_id: credentials._id }, function(error, findResponse){
          if(error){
               console.log('an error occured while reading data for user [' + credentials._id + '] from the database]');
               console.error(error.message);
               return;
          }

          /* OK - we read the user.  Does the password match? use the bcrypt compare() method */
          console.log('checking data for user [' + credentials._id + ']');

          bcrypt.compare(credentials.password, findResponse.encryptedPassword, function(err, res) {
               if (err) {
                    console.log('an error occured comparing passwords');
                    console.error(err.message);
                    return;
               }
               if(!res) {
                    /* password was incorrect */
                    console.log('password was incorrect');
                    /*
                    need to send failure response with status code 409
                    {
                    "status" : "fail",
                    "message" : "invalid user name or password"
               }
               */
               console.log('***** CONFIRM THAT WE ARE RETURNING THE CORRECT ERROR CODES *****');
               response.status(401);
               response.json({
                    "status": "fail",
                    "message": "invalid user name or password"
               });
               return;
               console.log('where to send user now?  do we need a return statement here?');
          } else {
               /* password must have been correct */
               console.log('password was correct');

               /* need to generate a token */
               uid = require('rand-token').uid;         /*   used by rand-token */
               token = uid(64);                         /*   used by rand-token */

               /* store the token in the user's authenticationTokens array in the database */

               /* how to get ten days from now? */

               var expirationDate = new Date();
               expirationDate.setDate(expirationDate.getDate() + 10);

               User.findByIdAndUpdate(
                    credentials._id,
                    { $push: { authenticationTokens:  {"token" : token, "expires" : expirationDate } } },
                    function(err, reply) {
                         if (err) {
                              console.error(err.message);
                              return;
                         }
                         console.log('Updated succeeded', reply);
                    }
               );

               response.status(200);
               response.json({
                    "status": "ok",
                    "token": token
               });
          }
     });
});

/* ------------------------------------------------------------------------------------------------------- */




app.listen(3000, function(){
     console.log('listening on port 3000');
});
