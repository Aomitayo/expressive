var debug = require('debug')('expressive:logging');
var bytes = require('bytes');
var express = require('express');
var app = require('app');
var appName = app.get('appName') || 'app';

function devFormat(tokens, req, res){
  var status = res.statusCode;
  var len = parseInt(res.getHeader('Content-Length'), 10);
  var color = 32;

  if (status >= 500) color = 31;
  else if (status >= 400) color = 33;
  else if (status >= 300) color = 36;

  len = isNaN(len) ? '' : len = ' - ' + bytes(len);

  return appName + ' \033[90m' + req.method +
    ' ' + req.originalUrl + ' ' +
    '\033[' + color + 'm' + res.statusCode +
    ' \033[90m' + (new Date() - req._startTime) +
    'ms' + len +
    '\033[0m ';
}

debug('Registering Logging middleware');

var format = app.get('env') == 'development'? devFormat : 'default';
app.use(express.logger({format:format, immediate:false}));