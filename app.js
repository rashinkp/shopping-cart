var createError = require('http-errors');
var express = require('express');
var cors  = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var usersRouter = require('./routes/users');
var adminsRouter = require('./routes/admin');
var fileUpload = require('express-fileupload')
var db = require('./config/connection')
var session = require('express-session')
const moment = require('moment');


var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, '/views/layout/'),
  partialsDir: path.join(__dirname, '/views/partials/'),
  // Add the runtime option to disable prototype access check
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  helpers: {
    
    calculateAge: function (dob) {
      const today = moment();
      const birthDate = moment(dob, 'YYYY-MM-DD'); // Assuming the date format stored in the database is 'YYYY-MM-DD'
      const age = today.diff(birthDate, 'years');
      return age;
    },
  },
}));

// app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));
app.use((req, res, next) => {
  res.locals.admin = req.session.admin; // Make admin data available in views
  res.locals.user = req.session.user;   // Make user data available in views
  next();
});

db.connect()
app.use('/', usersRouter);
app.use('/admin', adminsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
