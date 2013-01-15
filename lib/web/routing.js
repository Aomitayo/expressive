var debug = require('debug')('expressive:routing');
var methods = require('methods');
var en = require('lingo').en;
var querystring = require('querystring');

var app = require('app');
var injector = require('injector');

//app.use(app.router);

function RouteMapper(basePath){
    if(typeof basePath === 'object' && typeof parent == 'undefined'){
        basePath = undefined;
    }

	this.basePath = (basePath || '').replace(/\/$/, '');
}
RouteMapper.prototype.pathHelpers = {};

RouteMapper.prototype.mapSubroutes = function(subRouteBasePath, callback){
    var oldBasePath = this.basePath;
    this.basePath = oldBasePath + '/' + subRouteBasePath.replace(/^\/|\/$/g, '');
    callback(this);
    this.basePath = oldBasePath;
};

methods.concat(['del', 'all']).forEach(function(methodName){
  RouteMapper.prototype[methodName] = function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var path = args.shift();

        if(path instanceof RegExp && this.basePath){
            path = '^(' + this.basePath.replace(/\/$/, '') + ')' + path.source.replace(/^\^/, '');
            path = new RegExp(path);
        }
        else{
            path = this.basePath.replace(/\/$/, '' ) + '/' + path.replace(/^\//, '');
        }
        args.unshift(path);

        var helperName = this.pathHelperName(path, methodName);
        if(helperName){
            this.pathHelpers[helperName] = this.makeUrlGenerator.apply(this, arguments);
        }

        if(app[methodName]){
            app[methodName].apply(app, arguments);
        }
        else{
            debug("Application does not support '" + methodName + "' method");
        }
    };
});

RouteMapper.prototype.pathHelperName = function(path, method){
    var action = this.actionName(path, method);
    if (path instanceof RegExp) {
        path = path.toString().replace(/[^a-z]+/ig, '/');
    }

    // handle root pathHelpers
    if (path === '' || path === '/') return 'root';

    // remove trailing slashes and split to parts
    path = path.replace(/^\/|\/$/g, '').split('/');

    var nameParts = [];
    path.forEach(function (token, index, all) {
        // skip variables
        if (token[0] == ':') return;

        var nextToken = all[index + 1] || '';
        // current token is last?
        if (index == all.length - 1) {
            token = token.replace(/\.:format\??$/, '');
            // same as action? - prepend
            if (token == action) {
                nameParts.unshift(token);
                return;
            }
        }
        if (nextToken[0] == ':' || nextToken == 'new.:format?') {
            token = en.singularize(token);
        }
        nameParts.push(token);
    });
    return nameParts.join('_');
};

RouteMapper.prototype.actionName = function(path, method){
    var actions = {
		'index':/^GET.*\/\w+\.:format\?$/,
		'new':/^GET\/.*\/new\.:format\?$/,
		'create':/^POST\/.*\w+\.:format\?$/,
		'show':/^GET\/.*\/:\w+\.:format\?$/,
		'edit':/^GET\/.*\/:\w+\/edit\.:format\?$/,
		'update':/^PUT\/.*\/:\w+\.:format\?$/,
		'destroy':/^(DELETE|DEL)\/.*\/:\w+\.:format\?$/
	};
	var action;
	var testPath = method.toUpperCase() + path.replace(/\/$/, '').toLowerCase();
    Object.keys(actions).forEach(function(a){
        action = actions[a].test(testPath)? a : action;
	});
    return action;
};

RouteMapper.prototype.makeUrlGenerator = function(pathTemplate){
    var generator = function(params){
        params = params || {};

        var url = pathTemplate.toString(),
            queryArgs = {}, variableArgs = {};
        var re = /:(\w+)/g;
        var usedParam = [];
        if(typeof params === 'object'){
            while((match = re.exec(pathTemplate)) ){
                var k = match[1];
                if(params[k]){
                    url = url.replace(':'+k, params[k]);
                }
            }
            
            Object.keys(params).forEach(function(k){
                if(usedParam.indexOf(k) === -1){
                    queryArgs[k] = params[k];
                }
            });
        }
        else{
            url = url.replace(':id', params);
        }
        
        url = url.replace(/\.:format\?$/, '');

        url = Object.keys(queryArgs).length > 0? url + '?' + querystring.stringify(queryArgs) : url;
        return url;
    };
    generator.toString = function(){
        return generator();
    };
    return generator;
};

/**
 * Creates routes for resource controller actions
 * @param  {String}   name          The name of the resources
 * @param  {Object}   controller    The resource controller. Should have any or all of
 *                                  the actions index, create, new, edit, destroy, update, show
 * @param  {Object}   options  An object with map of action handlers or an object with the form
 *                             {only:[], except: []}
 * @param  {Function} callback [description]
 * @return {[type]}            The RouteMapper instance.
 */
RouteMapper.prototype.resource = function(name, controller, options, callback){
    var self = this;
    if (typeof name === 'object'){
        callback = options;
        options = controller;
        controller = name;
        name = null;
    }
    if(typeof options === 'function'){
        callback = options;
        options = null;
    }
    
    name = name?(en.isSingular(name)? en.pluralize(name): name): '';

    options = options || {};
    
    var availableRoutes = {
        'index':   'GET /',
        'create':  'POST /',
        'new':     'GET /new',
        'edit':    'GET /:id/edit',
        'destroy': 'DELETE /:id',
        'update':  'PUT /:id',
        'show':    'GET /:id'
    };


    var actions = options.only || Object.keys(availableRoutes);
    var ommitedActions = options.except || [];
    actions = actions.filter(function(action){
        return ommitedActions.indexOf(action) == -1;
    });
    
    //map the actions
    actions.forEach(function(action){
        var routeParts = availableRoutes[action].split(' ');
        var method = routeParts[0].toLowerCase();
        var path = routeParts[1];
        path = '/' + name + path.replace(/\/$/, '') + '.:format?';
        self[method](path, controller[action]);
    });
    
    //map subroutes
    if(callback) self.mapSubroutes(name, callback);

    return self;
};

var routeMapper = new RouteMapper();
injector.register('routing/Mapper', routeMapper);

app.locals.path_to = routeMapper.pathHelpers;
