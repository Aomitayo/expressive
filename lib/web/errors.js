var app = require('app');
var injector = require('injector');

function HttpError(message, statusCode){
	Error.apply(this);
	this.name = 'HttpError';
	this.message = message || "A HTTP Error Occured";
	this.statusCode = statusCode || 500;
}
HttpError.prototype = new Error();
HttpError.prototype.constructor = HttpError;

injector.register('HttpErrors/Base', HttpError);