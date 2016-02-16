// function (require) {
// 	// use "strict";
var express = require('express'),
    exphbs = require('express3-handlebars'),
    bodyParser = require('body-parser'),
    _ = require("underscore")
    Backbone = require('backbone');

var app = express();

// View.prototype.initialize = function(argument){
	
// };

// return View;	
// };
module.exports.Config = Backbone.View.extend({

  tagName: "li",

  className: "document-row",

  events: {
  },

  initialize: function() {
    app.listen(3000);
    app.engine('handlebars', exphbs());
    app.set('view engine', 'handlebars');
    // parsing form input
    app.use(bodyParser());
  },

  render: function() {
  }

});


