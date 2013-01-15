var debug = require('debug')('expressive:templating');
var express = require('express');

var app = require('app');
var templatesConfig = require('templatesConfig');

var consolidate = require('consolidate');
var engines = templatesConfig.engines || [{engine:'qejs', ext: 'ejs'}];
engines.forEach(function(engine){
	var viewEngine = engine.engine;
	viewEngine = typeof viewEngine == 'string'?
		consolidate[viewEngine] || consolidate.qejs :
		viewEngine;

	var exts = engine.ext;
	exts = Array.isArray(exts)? exts : [exts];
	
	exts.forEach(function(ext){
		app.engine(ext, viewEngine);
	});
});

var templatePaths = templatesConfig.paths || [ process.cwd() + '/views'];
templatePaths = Array.isArray(templatePaths)? templatePaths : [templatePaths];

app.set('views', templatePaths[0]);
app.set('view engine', 'ejs');

var _render = app.render;

app.render = function(){
	if(templatePaths.length === 0){ throw new Error('No template paths were configured');}

	if(templatePaths.length  <= 1){
		app.set('views', templatePaths[0]);
		return _render.apply(this, arguments);
	}

	for(var index in templatePaths.slice(0, -1)){
		//debug('Rendering from Template path: %s', templatePaths[index]);
		app.set('views', templatePaths[index]);
		try{
			_render.apply(this, arguments);
			return;
		}
		catch(err){}
	}
	//debug('Rendering %s from Template path: %s', arguments[0], templatePaths[templatePaths.length-1]);
	app.set('views', templatePaths[templatePaths.length-1]);
	return _render.apply(this, arguments);
};