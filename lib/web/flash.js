var debug = require('debug')('expressive:flash');
var app = require('app');
var format = require('util').format;

function _flash(type, msg) {
	if (this.session === undefined) throw Error('req.flash() requires sessions');
	var msgs = this.session.flash = this.session.flash || {};
	if (type && msg) {
		// util.format is available in Node.js 0.6+
		if (arguments.length > 2 && format) {
			var args = Array.prototype.slice.call(arguments, 1);
			msg = format.apply(undefined, args);
		}
		return (msgs[type] = msgs[type] || []).push(msg);
	} else if (type) {
		var arr = msgs[type];
		delete msgs[type];
		return arr || [];
	} else {
		this.session.flash = {};
		return msgs;
	}
}

function ExpressiveFlash(req, res, next){
	req.flash = _flash;
	next();
}

app.use(ExpressiveFlash);