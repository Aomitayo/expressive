/*
 * expressive
 * https://github.com/Aomitayo/expressive
 *
 * Copyright (c) 2012 Adedayo Omitayo
 * Licensed under the MIT license.
 */
var fs = require('fs');
var path = require('path');
var injectr = require('injectr');
var express = require('express');

function Expressive(){
	var self = this;

	//initialize injectables
	self.injectables = {
		injectables: {
			add: function(k, v){
				self.injectables[k] = v;
			},
			get: function(prefix, all){
				var moduleRe = typeof prefix === 'string'? new RegExp(prefix) : prefix;
				var matchingModules = Object.keys(self.injectables).filter(function(name){
					return moduleRe.test(name);
				})
				.map(function(name){
					return self.injectables[name];
				});
				return matchingModules.length == 1? matchingModules[0] : matchingModules;
			}
		},
		express: express
	};

	//collate expressive modules
	self.walkPath(__dirname + '/expressives', function(modulePath, stats, depth){
		if(stats.isDirectory()){return;}
		var moduleName = modulePath.split(path.sep).slice(0 - depth).join(path.sep);
		moduleName = moduleName.replace('.js', '');
		self.expressiveModules.push(moduleName);
	});
}

Expressive.prototype.expressiveModules = [];

Expressive.prototype.isExpressiveModule = function(modulePath){
	return this.expressiveModules.indexOf(modulePath) != -1;
};

Expressive.prototype.resolveModule = function(modulePath){
	var self = this;
	if(self.isExpressiveModule(modulePath)){
		return path.normalize(path.resolve(__dirname + '/expressives', modulePath + '.js'));
	}
	else if(/^\//.test(modulePath)){
		return path.normalize(
			path.resolve(modulePath)
		);
	}
	else if(/^(\.\/|\.\.\/)/.test(modulePath)){
		return path.normalize(
			path.resolve( path.dirname(module.parent.filename), modulePath)
		);
	}
	else{

		try{
			var nameParts = modulePath.split(path.sep);
			var packageName = nameParts[0];
			var packagePath = require.resolve(packageName);
			var resolvedPath = nameParts.length > 1?
				path.resolve(path.dirname(packagePath), nameParts.slice(1).join(path.sep)):
				packagePath;
			return resolvedPath;
		}
		catch(err){
			console.trace(err);
			return null;
		}
	}
};

Expressive.prototype.walkPath = function(pathName, callback, currentDepth, maxDepth){
	if(!fs.existsSync(pathName) ){
		throw new Error('File ' + pathName + ' does not exists');
	}
	
	var self = this;
	
	currentDepth = currentDepth >= 0 ? currentDepth + 1 : 0;
	var stats = fs.statSync(pathName);
	callback(pathName, stats, currentDepth);

	var doRecurse = maxDepth? (maxDepth > 0) : true;
	if(stats.isDirectory() && doRecurse){
		maxDepth = maxDepth? maxDepth - 1 : maxDepth;
		fs.readdirSync(pathName).sort().forEach(function(name){
			self.walkPath(path.join(pathName, name), callback, currentDepth, maxDepth );
		});
	}
};

Expressive.prototype.loadModules = function(modulesPath, prefix, callback){
	var self = this;
	callback = callback || function(moduleName, m){
		self.injectables[moduleName] = m;
		//console.log('Loaded', moduleName);
	};

	self.walkPath(modulesPath, function(modulePath, stats, depth ){
		if(stats.isDirectory()){return;}
		var moduleName = (prefix || '') + modulePath.split(path.sep).slice(0 -(depth + 1)).join(path.sep);
		moduleName = moduleName.replace('.js', '');

		var injectrContext = {};
		Object.keys(global).forEach(function(k){
			if(['global', 'GLOBAL', 'require', 'module'].indexOf(k) == -1){
				injectrContext[k] = global[k];
			}
		});
		injectrContext.__dirname = path.dirname(modulePath);
		injectrContext.__filename = modulePath;
		
		var m = injectr(modulePath, self.injectables, injectrContext);

		callback(moduleName, m);
	});
};

Expressive.prototype.loadDependencies = function(dependencies){
	var self = this;
	Object.keys(dependencies || {}).forEach(function(k){
		if(self.injectables[k]){return;}
		self.injectables[k] = dependencies[k];
	});
};

Expressive.prototype.loadFromSpecs = function(moduleSpecs){
	var self = this;

	var modulePath;
	
	moduleSpecs.forEach(function(moduleSpec){
		if(typeof moduleSpec === 'string'){
			modulePath = self.resolveModule(moduleSpec);
			if(modulePath){self.loadModules(modulePath);}
		}
		else if(Array.isArray(moduleSpec)){
			modulePath = self.resolveModule(moduleSpec[1]);
			if(modulePath){self.loadModules(modulePath, moduleSpec[0]);}
		}
		else if(typeof moduleSpec === 'function'){

		}
		else{}
	});
};

Expressive.prototype.prepare = function(app, moduleSpecs, dependencies){
	var self = this;
	
	self.injectables.app = app;
	self.loadDependencies(dependencies);
	self.loadFromSpecs(moduleSpecs);

	var modulePath;
	
};

module.exports = Expressive;