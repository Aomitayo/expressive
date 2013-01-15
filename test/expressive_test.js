var Expressive = require('../lib/expressive.js');
var expect = require('chai').expect;
var path = require('path');

describe('Expressive', function(){
  var expressive;
  before(function(){
    expressive = new Expressive();
  });
  it('Should detect in-built expressive modules', function(){
    ['web/flash', 'web/helpers', 'web/logging', 'web/routing', 'web/templating'].forEach(function(name){
      expect(expressive.isInbuiltExpressive(name)).to.be.true
    });
  });

  it('Should be able to  modularize express app', function(){
    var express = require('express'),
      app = express();
    expressive.injector.register('express', express);
    expressive.injector.register('templatesConfig', {
      engines:[ {engine:'qejs', ext:'ejs'} ],
      paths: [ __dirname + '/views' ]
    });
    expressive.modularize(app, [
      path.join(__dirname, 'fixtures/webapp/lib/base.js'),
      'web/flash',
      'web/helpers',
      'web/templating',
      'web/logging',
      'web/routing'
    ]);
    expect(app.get('port')).to.equal(3000);
    expect(expressive.injector.get('web/flash')).to.not.be.null;
  });

  it('Should delegate register function to its internal injector instance', function(){
    expressive.register('dundun', 'dundun value');
    expect(expressive.injector.get('dundun')).to.equal('dundun value');
  });

  it('Should delegate get function to its internal injector instance', function(){
    expressive.register('dundun', 'dundun value');
    expect(expressive.get('dundun')).to.equal('dundun value');
  });
  
  it('Should delegate base path property to its internal injector instance', function(){
    expressive.basePath = __dirname;
    expect(expressive.injector.basePath).to.equal(__dirname);
  });

});