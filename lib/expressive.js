/*
 * expressive
 * https://github.com/Aomitayo/expressive
 *
 * Copyright (c) 2012 Adedayo Omitayo
 * Licensed under the MIT license.
 */
var fs = require('fs');
var path = require('path');
var Injector = require('./injector.js');
var express = require('express');

var Expressive = module.exports = function Expressive(app){
	var self = this;
	self.injector = new Injector();
	if (app){ self.injector.register('app', app);}

	self.expressivesPaths = {};
	//collate expressive modules
	self.injector._walkPath(__dirname + '/web', function(modulePath, stats, depth){
		if(stats.isDirectory()){return;}
		var moduleName = modulePath.split(path.sep).slice(0 - depth).join(path.sep);
		moduleName = 'web/' + moduleName.replace('.js', '');
		self.expressivesPaths[moduleName] = modulePath;
	});
};

Expressive.prototype.isInbuiltExpressive = function(moduleName){
	return this.expressivesPaths[moduleName]? true : false;
};

Expressive.prototype.modularize = function(app, moduleSpecs){
	var self = this;

	if(!moduleSpecs){
		moduleSpecs = app;
		app = undefined;
	}

	if(app){this.injector.register('app', app);}

	moduleSpecs.forEach(function(spec){
		if(self.isInbuiltExpressive(spec)){
			// var orginalBasePath = self.injector.basePath;
			// self.injector.basePath = __dirname;
			self.injector.get(self.expressivesPaths[spec]);
		}
		else{ self.injector.get(spec);}

	});
};


//Delegated functions to injector api
['register', 'get'].forEach(function(fName){
	Expressive.prototype[fName] = function(){
		return this.injector[fName].apply(this.injector, arguments);
	};
});

//define delegated properties
['basePath'].forEach(function(name){
	Object.defineProperty(Expressive.prototype, name, {
		get: function(){return this.injector[name];},
		set: function(val){this.injector[name] = val;}
	});
});