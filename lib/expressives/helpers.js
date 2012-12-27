var debug = require('debug')('expressive:helpers');
var app = require('app');
var expressHelpers = require('express-helpers')(app);
app.dynamicHelpers = {
	requestAndResponse: function(req, res){
		res.locals({
			request: req,
			req: req,
			response: res,
			res: res
		});
	},
	csrf_meta_tag: function(req, res){
		res.locals.csrf_meta_tag = function(){
			return [
				'<meta name="csrf-param" content="_csrf"/>',
				'<meta name="csrf-token" content="' + req.session._csrf + '"/>'
			].join('\n');
		};
	},
	csrf_tag: function(req, res){
		res.locals.csrf_tag = function(){
			return '<input type="hidden" name="_csrf" value="' + req.session._csrf + '" />';
		};
	}
};

debug('Registering Helpers Middleware');
app.use(function ExpressiveHelpers(req, res, next){
	Object.keys(app.dynamicHelpers).forEach(function(k){
		app.dynamicHelpers[k](req, res);
	});
	next();
});