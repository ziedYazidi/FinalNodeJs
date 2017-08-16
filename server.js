
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

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

app.get('/', routes.index);
  app.get('/users', user.list);
app.get('/tasks',function (req,res) {
  res.render('tasks');
});

//Functions
function getData() {
  mongo.connect('mongodb://zytododb:KYnL6Fy4uTAqwFKFid2srWmD9aqJyXhbhOWXA1ROwAPpmB5e2953yJmHT6rC30deQTgOuaQVPpg1hmqfNM4jXA==@zytododb.documents.azure.com:10255/?ssl=true&replicaSet=globaldb',function (err,db) {
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

io.on('connection',function (socket) {
  console.log('user connected');
  getData();
  socket.on('save',function(Title,date,description) {
    // Get data from Database

    //Database
    mongo.connect('mongodb://zytododb:KYnL6Fy4uTAqwFKFid2srWmD9aqJyXhbhOWXA1ROwAPpmB5e2953yJmHT6rC30deQTgOuaQVPpg1hmqfNM4jXA==@zytododb.documents.azure.com:10255/?ssl=true&replicaSet=globaldb',function (err, db) {
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
    mongo.connect('mongodb://zytododb:KYnL6Fy4uTAqwFKFid2srWmD9aqJyXhbhOWXA1ROwAPpmB5e2953yJmHT6rC30deQTgOuaQVPpg1hmqfNM4jXA==@zytododb.documents.azure.com:10255/?ssl=true&replicaSet=globaldb',function (err, db) {
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

