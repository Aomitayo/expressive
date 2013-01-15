var express = require('express');
var app = require('app');

app.enable('trust proxy');
app.set('port', 3000);
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('app secret'));
