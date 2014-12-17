'use strict';

var Crawler = require('crawler');
var _ = require('lodash');
var URI = require('uri-js');
var redis = require('../services/redisService').redisService;
var async = require('async');

var count = 0;

var indexCrawler = new Crawler({
    maxConnections: 1,
    forceUTF8: true,
    skipDuplicates: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0',
    callback: function(err, result, $) {
        async.eachSeries($('.listw li a'), function(item, cb) {
            var text = $(item).text().trim();
            var link = URI.resolve(result.uri, $(item).attr('href'));

            redis.save('text:' + text, link, cb);
        }, function() {
            var c = $('.listw li a').length;
            console.log('processed ' + c + ' items');
            count += c;

            _.forEach($('.mainbar3 .a2 a'), function(item) {
                if ($(item).text() == '下一页') {
                    indexCrawler.queue(URI.resolve(result.uri, $(item).attr('href')));
                }
            });
        });
    },
    onDrain: function() {
        console.log('finish ' + count);
        process.exit(0);
    }
});

exports.indexCrawler = indexCrawler;
