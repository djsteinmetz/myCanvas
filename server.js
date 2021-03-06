require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var passport = require('passport');
var session = require('express-session');
var moment = require('moment');
var flash = require('connect-flash');

var db = require('./models');

var app = express();
var PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// For Passport
app.use(session({
  secret: 'magical secret pony or something',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000,
  }
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

// Handlebars
app.engine(
  'handlebars',
  exphbs({
    defaultLayout: 'main',
    helpers: {
      compare: function (lvalue, rvalue, options) {

        if (arguments.length < 3) {
          throw new Error('Handlerbars Helper \'compare\' needs 2 parameters');
        }

        var operator = options.hash.operator || '==';

        var operators = {
          '==': function (l, r) {
            return l == r;
          },
          '===': function (l, r) {
            return l === r;
          },
          '!=': function (l, r) {
            return l != r;
          },
          '<': function (l, r) {
            return l < r;
          },
          '>': function (l, r) {
            return l > r;
          },
          '<=': function (l, r) {
            return l <= r;
          },
          '>=': function (l, r) {
            return l >= r;
          },
          'typeof': function (l, r) {
            return typeof l === r;
          }
        };

        if (!operators[operator]) {
          throw new Error('Handlerbars Helper \'compare\' doesn\'t know the operator ' + operator);
        }

        var result = operators[operator](lvalue, rvalue);

        if (result) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
      formatDate: function (date, format) {
        return moment(date).format(format);
      }
    }
  })
);
app.set('view engine', 'handlebars');

// Routes
require('./routes/apiRoutes')(app, passport);
require('./routes/authRoutes')(app, passport);
require('./routes/htmlRoutes')(app);

require('./config/passport')(passport, db.User);

var syncOptions = { force: false };

// If running a test, set syncOptions.force to true
// clearing the `testdb`
if (process.env.NODE_ENV === 'test') {
  syncOptions.force = true;
}

// Starting the server, syncing our models ------------------------------------/
db.sequelize.sync(syncOptions).then(function () {
  app.listen(PORT, function () {
    console.log(
      '==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.',
      PORT,
      PORT
    );
  });
});

module.exports = app;
