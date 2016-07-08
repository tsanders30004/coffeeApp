var express = require('express');
var app = express();
var User = require('./user');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var randomtoken = require('rand-token');     /* https://www.npmjs.com/package/rand-token */

/* CORS Setup - from https://www.npmjs.com/package/cors#simple-usage-enable-all-cors-requests */
var cors = require('cors');
/* CORS */

app.use(cors());
app.get('/products/:id', function(req, res, next){                    /* Need to come back to this */
  res.json({msg: 'This is CORS-enabled for all origins!'});
});

/* MongoDB Setup */
mongoose.connect('mongodb://localhost/coffeeDb');

/* bcrypt Setup */
var saltRounds = 10;
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

var grindDecision = {};
var deliveryOptions = [];
var individualPackage = [];

var myNewUser;

/* Routing to options on the frontend */
app.get('/options', function(request, response){
     response.json(coffeeOptions);
});



/* Routing to deliveries on the frontend */
app.post('/deliveries', function(request, response){
     response.json(individualPackage);
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
                                   console.error(err.errors);
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
     // response.send('ok');

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
               /* and easier way would have been to */

               response.status(200);
               response.json({
                    "status": "ok",
                    "token": token
               });
          }
     });
});

});

/* ------------------------------------------------------- */

app.post('/orders', function(request, response){
     // console.log(response);
     var orderData = request.body;

     User.findOne({"authenticationTokens.token" : orderData.token}, function(error, findOneResponse){
          if (error) {
               console.log('error was found searching for the token');
               console.log(error.message);
               return;
          }
          /* findOneResponse now returns the data returned from the database */

          /* add the users orders */
          findOneResponse.orders.push(orderData.order);     /* data is now in memory */
          findOneResponse.save(function(err){
               if(err){
                    console.log('there was an error saving the order');
                    console.log(err.errors);
               }
               /* there was no error */
               response.json({
                    status :  "ok",
               });
               // response.send('ok');
               return;
          });
     });
});

app.get('/orders', function(request, response){
     /* step 1:  get the query parameter */
     var tokenData = request.query.token;

     /* get the user for whom the token was provided */

     User.findOne({"authenticationTokens.token" : tokenData}, function(error, findOneResponse){
          if (error) {
               console.log('user with token [' + tokenData + '] not found...');
               console.log(error.message);
               return;
          }
          console.log(findOneResponse.orders);
          response.json(findOneResponse.orders);
     });

});

app.listen(3000, function(){
     console.log('listening on port 3000');
});
