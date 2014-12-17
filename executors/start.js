'use strict';

var indexCrawler = require('../services/indexCrawler').indexCrawler;
var url = require('url');
var _ = require('lodash');

var alphas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

_.forEach(alphas, function(c) {
    var s = 'http://chengyu.itlearner.com/list/' + c + '_1.html';
    indexCrawler.queue(s);
});
