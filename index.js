var express = require('express'),
    exphbs = require('express3-handlebars'),
    bodyParser = require('body-parser'),
    _ = require("underscore")
    Backbone = require('backbone'),
    elasticsearch = require('elasticsearch');

var app = express();

initialize();
//var path    = require("path");

app.get('/', function (req, res) {
    res.redirect('/task');
});


var userBody = {
    user: {
        properties: {
            username: {"type": "string", "index": "not_analyzed"},
            password: {"type": "string", "index": "not_analyzed"},
            userId: {"type": "integer"}
        }
    }
};

var todoBody = {
    todo: {
        properties: {
            taskId : {"type" : "integer"},
            name: {"type": "string", "index": "not_analyzed"},
            priority : {"type" : "integer"},
            tags : {"type" : "string", "index" : "not_analyzed"},
            timestamp: {"type": "string"}
        }
    }
};
var client = createElasticSearchInstance();
if (client.indices.exists({index: "user-details", type: "user"})) {

   client.indices.putMapping({index: "user-details", type: "user", body: userBody});
   client.indices.putMapping({index: "user-details", type: "todo", body: todoBody});
} else {
   //TODO create a new index and put the mapping
}

app.get('/about', function (req, res) {
    res.render('about');
});

app.post('/add-todo', function (req, res) {
    var client = createElasticSearchInstance();
    pingEs(client);
    var priority = 0;
    var taskName = req.body.task;
    if (req.body.task.charAt(0) == '!' && req.body.task.charAt(1) == '!') {
        priority++;
        taskName = taskName.substring(2);
    }
 
    addToIndex(client, taskName, priority, res);
    
});



app.get('/task', function (req, res) {

    createElasticSearchInstance();
    pingEs(client);
    var serachQuery = req.body.taskName || "";
    console.log("Herere--------------");
    if (req.body.taskName) {

        client.search({
        index: 'user-details',
        type: 'todo',
        q : serachQuery,
        sort : ["priority:desc", "timestamp:desc"],
    }, function (error, response) {
        var hits = response.hits.hits;
        
    var task = [];
    var count = 1;
    _.each(hits, function(object, index){

        var message = dateMessage(new Date(object._source.timestamp));
        if (message) {
         task.push({
            "count" : count,
            "taskId" : object._source.taskId,
            "name"  : object._source.name,
            "tags"  : object._source.tags,
            "priority" : object._source.priority,
            "timestamp" : object._source.timestamp,
            "message" : message
        });   
     }else {
        console.log("Herere213--------------");
        task.push({
            "count" : count,
            "taskId" : object._source.taskId,
            "name"  : object._source.name,
            "tags"  : object._source.tags,
            "priority" : object._source.priority,
            "timestamp" : object._source.timestamp,
        });
     }
        
        count++;
     });

     res.render('index', {
            task : task
        });
    });
    }else {

        client.search({
        index: 'user-details',
        type: 'todo',
        sort : ["priority:desc", "timestamp:desc"],
    }, function (error, response) {
        var hits = response.hits.hits;
        
    var task = [];
    var count = 1;
    _.each(hits, function(object, index){

        var message = dateMessage(new Date(object._source.timestamp));
        if (message) {
         task.push({
            "count" : count,
            "taskId" : object._source.taskId,
            "name"  : object._source.name,
            "tags"  : object._source.tags,
            "priority" : object._source.priority,
            "timestamp" : object._source.timestamp,
            "message" : message
        });   
     }else {
        task.push({
            "count" : count,
            "taskId" : object._source.taskId,
            "name"  : object._source.name,
            "tags"  : object._source.tags,
            "priority" : object._source.priority,
            "timestamp" : object._source.timestamp,
        });
     }
        
        count++;
     });

     res.render('index', {
            task : task
        });
    });
    }
    

});

app.post('/search', function(req, res) {
    createElasticSearchInstance();
    pingEs(client);
    var serachQuery = req.body.task;
    console.log(req.body.task);

    client.search({
        index: 'user-details',
        type: 'todo',
        q : req.body.task,
        sort : ["priority:desc", "timestamp:desc"],
    }, function (error, response) {
        var hits = response.hits.hits;
        
    var task = [];
    var count = 1;
    _.each(hits, function(object, index){

        var message = dateMessage(new Date(object._source.timestamp));
        if (message) {
         task.push({
            "count" : count,
            "taskId" : object._source.taskId,
            "name"  : object._source.name,
            "tags"  : object._source.tags,
            "priority" : object._source.priority,
            "timestamp" : object._source.timestamp,
            "message" : message
        });   
     }else {
        console.log("Herere213--------------");
        task.push({
            "count" : count,
            "taskId" : object._source.taskId,
            "name"  : object._source.name,
            "tags"  : object._source.tags,
            "priority" : object._source.priority,
            "timestamp" : object._source.timestamp,
        });
     }
        
        count++;
     });

     res.render('index', {
            task : task
        });
    });
})

app.post('/add-tags', function(req, res) {
    var client = createElasticSearchInstance();
    var id = req.body.taskId,
        tags = req.body.tags.split(',');
    pingEs(client);
    client.update({
  index: 'user-details',
  type: 'todo',
  id: id,
  body: {
    // put the partial document under the `doc` key
    doc: {
      tags: tags
    }
  }
}, function (error, response) {
  res.redirect('/task');
})
    
});

app.post('/delete', function(req, res) {
    var client = createElasticSearchInstance();
    console.log("delete");
    var id = req.body.taskId;
    pingEs(client);
    client.delete({
  index: 'user-details',
  type: 'todo',
  id: id,
  body: {
  }
}, function (error, response) {
  res.redirect('/task');
})
});


app.post('/edit-todo', function(req, res) {
    var client = createElasticSearchInstance();
    var id = req.body.taskId,
        taskName = req.body.task;
    var priority = 0;
    var taskName = req.body.task;
    if (req.body.task.charAt(0) == '!' && req.body.task.charAt(1) == '!') {
        priority++;
        taskName = taskName.substring(2);
    }
    pingEs(client);
    client.update({
  index: 'user-details',
  type: 'todo',
  id: id,
  body: {
    // put the partial document under the `doc` key
    doc: {
      name : taskName,
      priority : priority
    }
  }
}, function (error, response) {
  res.redirect('/task');
})
    
});

app.use('/public',express.static('public'));
//app.get('/',function(req,res){
//    res.sendFile(path.join(__dirname+'/index.html'));
//    //__dirname : It will resolve to your project folder.
//});

function initialize() {
    app.listen(3000);
    app.engine('handlebars', exphbs());
    app.set('view engine', 'handlebars');
    // parsing form input
    app.use(bodyParser());
}



function createElasticSearchInstance() {
   return client = new elasticsearch.Client({
        host: 'localhost:9200',
        log: 'trace'
    });
}

function pingEs(client) {
    client.ping({
        // ping usually has a 3000ms timeout 

        requestTimeout: "3000ms",

        hello: "elasticsearch!"
    }, function (error) {
        if (error) {
            // console.trace('elasticsearch cluster is down!');
        } else {
            // console.log('All is well');
        }
    });
}

function addToIndex(client, taskName, priority, res) {
    var id = Math.random();
    client.index({
        index: 'user-details',
        type: 'todo',
        id : id,
        body: {
            taskId : id,
            name : taskName,
            timestamp : new Date(),
            priority : priority
        }
    }, function (error, response) {
        res.redirect('/task');
    });
}

function dateMessage(date) {
    var day = date.getDate(),
        month = date.getMonth(),
        year = date.getFullYear();

    var currentDate = new Date();
        currentDay = currentDate.getDate(),
        currentMonth = currentDate.getMonth(),
        currentYear = currentDate.getFullYear();

    if (currentDay === day && currentMonth === month && currentYear === year) {
        return "Today";
    }


    if (currentDay-1 === day && currentMonth === month && currentYear === year) {
       
    return "Yesterday";
    }

    if (currentDay-7 === day && currentMonth === month && currentYear === year) {
    return "last week";
    }
    
    if (currentDay-14 === day && currentMonth === month && currentYear === year) {
    return "last sprint";
    }

    if (currentMonth-1 === month && currentYear === year) {
    return "last month";
    }

    if (currentYear-1 === year) {
    return "last month";
    }

    return '';
}
