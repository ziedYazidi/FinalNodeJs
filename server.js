
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , expressSession = require('express-session')
  , path = require('path')
  , bunyan = require('bunyan')
  , config = require('./config')
  , passport = require('passport')
  , MongoStore = require('connect-mongo')(expressSession)
  , mongoose = require('mongoose');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
var io = require('socket.io')(server);
var socket= io;
var mongo = require('mongodb').MongoClient;
app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/users', user.list);
app.get('/tasks',function (req,res) {
  res.render('tasks');
});

app.get('/current',function (req,res) {
  res.render('current');
});

//Functions
function getData() {
  mongo.connect('mongodb://127.0.0.1:27017/ToDoList',function (err,db) {
    if(err)
    {
      console.warn(err.message);
    }
    else
    {
      db.collection("ToDoList").find({}).toArray(function(err, result) {
        if (err) throw err;
        db.collection("ToDoList").find({}).count(function (erreur, number) {
          if(erreur) throw  erreur;
          socket.emit('data',result,number);
        });
        db.close();

      });


    }
  });
}

function getCurrentdata(){
  mongo.connect('mongodb://127.0.0.1:27017/ToDoList',function (err,db) {
    if(err)
    {
      console.warn(err.message);
    }
    else
    {
      var date = new Date();
      var month = date.getUTCMonth() + 1; //months from 1-12
      var day = date.getUTCDate();
      var year = date.getUTCFullYear();
      if(month.length!=2)
        month="0"+month;
      var newdate = year+"-"+month+"-"+day;
      db.collection("ToDoList").find({date:newdate}).toArray(function(err, result) {
        if (err) throw err;
        db.collection("ToDoList").find({date:newdate}).count(function (erreur, number) {
          if(erreur) throw  erreur;
          socket.emit('currentData',result,number);
        });
        db.close();
      });
    }
  })
}
io.on('connection',function (socket) {
  console.log('user connected');
  getData();
  getCurrentdata();
  socket.on('save',function(Title,date,description) {
    // Get data from Database

    //Database
    mongo.connect('mongodb://127.0.0.1:27017/ToDoList',function (err, db) {
      if(err)
      {
        Console.warn(err.message);
      }
      else
      {
        var collection = db.collection('ToDoList');
        var list = '{ "Title":"' +
            Title   +
            '", "date":"' +
            date    +
            '" , "description":"' +
            description +
            '"}';
        var JSONList = JSON.parse(list);
        collection.insert(JSONList,function (err,o) {
          if(err)
          {
            Console.warn(err.message);
          }
          else
          {
            console.log("list inserted into db OK");
          }

        })
      }
    })
  });
  socket.on('update',function (oldTitle,oldDescription,newTitre,newDesc) {
    mongo.connect('mongodb://127.0.0.1:27017/ToDoList',function (err, db) {
      if(err)
      {
        Console.warn(err.message);
      }
      else
      {
        var collection = db.collection('ToDoList');
        db.ToDoList.update({Titre:oldTitle,description:oldDescription},{ Titre: newTitre, description:newDesc },{ upsert: true });
        console.log('Updating');
        db.close();
      }
    })

  });

  //Notify the server after every user disconnected
  socket.on('disconnect',function (socket) {
    console.log('user disconnected');
  });


});


// ACTIVE DIRECTORY HERE
// Start QuickStart here

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

var log = bunyan.createLogger({
  name: 'Microsoft OIDC Example Web Application'
});
/******************************************************************************
 * Set up passport in the app
 ******************************************************************************/

//-----------------------------------------------------------------------------
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
//-----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
  done(null, user.oid);
});

passport.deserializeUser(function(oid, done) {
  findByOid(oid, function (err, user) {
    done(err, user);
  });
});

// array to hold logged in users
var users = [];

var findByOid = function(oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    log.info('we are using user: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};
//-----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
//
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
//
// The following are the accepted prototypes for the `verify` function
// (1) function(iss, sub, done)
// (2) function(iss, sub, profile, done)
// (3) function(iss, sub, profile, access_token, refresh_token, done)
// (4) function(iss, sub, profile, access_token, refresh_token, params, done)
// (5) function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
// (6) prototype (1)-(5) with an additional `req` parameter as the first parameter
//
// To do prototype (6), passReqToCallback must be set to true in the config.
//-----------------------------------------------------------------------------
passport.use(new OIDCStrategy({
      identityMetadata: config.creds.identityMetadata,
      clientID: config.creds.clientID,
      responseType: config.creds.responseType,
      responseMode: config.creds.responseMode,
      redirectUrl: config.creds.redirectUrl,
      allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
      clientSecret: config.creds.clientSecret,
      validateIssuer: config.creds.validateIssuer,
      isB2C: config.creds.isB2C,
      issuer: config.creds.issuer,
      passReqToCallback: config.creds.passReqToCallback,
      scope: config.creds.scope,
      loggingLevel: config.creds.loggingLevel,
      nonceLifetime: config.creds.nonceLifetime,
      nonceMaxAmount: config.creds.nonceMaxAmount,
      useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
      cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
      clockSkew: config.creds.clockSkew,
    },
    function(iss, sub, profile, accessToken, refreshToken, done) {
      if (!profile.oid) {
        return done(new Error("No oid found"), null);
      }
      // asynchronous verification, for effect...
      process.nextTick(function () {
        findByOid(profile.oid, function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            // "Auto-registration"
            users.push(profile);
            return done(null, profile);
          }
          return done(null, user);
        });
      });
    }
));
// set up session middleware
if (config.useMongoDBSessionStore) {
  mongoose.connect(config.databaseUri);
  app.use(express.session({
    secret: 'secret',
    cookie: {maxAge: config.mongoDBSessionMaxAge * 1000},
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      clear_interval: config.mongoDBSessionMaxAge
    })
  }));
} else {
  app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
}
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};
app.get('/', function(req, res) {
  res.render('index', { user: req.user });
});

// '/account' is only available to logged in user
app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', { user: req.user });
});

app.get('/login',
    function(req, res, next) {
      passport.authenticate('azuread-openidconnect',
          {
            response: res,                      // required
            resourceURL: config.resourceURL,    // optional. Provide a value if you want to specify the resource.
            customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
            failureRedirect: '/'
          }
      )(req, res, next);
    },
    function(req, res) {
      log.info('Login was called in the Sample');
      res.redirect('/');
    });

// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get('/auth/openid/return',
    function(req, res, next) {
      passport.authenticate('azuread-openidconnect',
          {
            response: res,                      // required
            failureRedirect: '/'
          }
      )(req, res, next);
    },
    function(req, res) {
      log.info('We received a return from AzureAD.');
      res.redirect('/');
      console.log("hello");
    });

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post('/auth/openid/return',
    function(req, res, next) {
      passport.authenticate('azuread-openidconnect',
          {
            response: res,                      // required
            failureRedirect: '/'
          }
      )(req, res, next);
    },
    function(req, res) {
      log.info('We received a return from AzureAD.');
      res.redirect('/');
    });

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', function(req, res){
  req.session.destroy(function(err) {
    req.logOut();
    res.redirect(config.destroySessionUrl);
  });
});
