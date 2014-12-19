'use strict';

var lineReader = require('line-reader');
var _ = require('lodash');
var S = require('string');
var fs = require("fs");
var path = require('../config/data').config.data();

var FROM = 0;
var WORD_LIMIT = 30000;

var words = {};
var relations = {};
var count = 0;
var idioms = [];

lineReader.eachLine(path.out, function (line, last) {
    if (!_.isEmpty(line)) {
        var word = S(line).split('\t')[0];

        if (word.length == 4) {
            count++;
            console.log(word + '\t' + count);

            idioms.push(word);
        }
    }

    if (last) {
        onLast();
    }
});

var processIdiomList = function (list) {
    words = {};
    relations = {};

    _.forEach(list, function (word) {
        _.forEach(word, function (w) {
            if (!_.has(words, w)) {
                words[w] = 1;
            } else {
                words[w]++;
            }
        });

        for (var i = 0; i < 3; i++) {
            var r = word[i] + '-' + word[i + 1];
            if (!_.has(relations, r)) {
                relations[r] = 1;
            } else {
                relations[r]++;
            }
        }
    });
};

var onLast = function () {
    processIdiomList(idioms);

    console.log('the length of words ' + _.keys(words).length);
    console.log('the length of relations ' + _.keys(relations).length);

    var w = _(words).pairs().sortBy(function (w) { return -w[1]; }).rest(FROM).first(WORD_LIMIT).map(function (v) {
        return v[0];
    }).value();

    idioms = _.filter(idioms, function (i) {
        for (var ii = 0; ii < i.length; ii++) {
            if (!_.contains(w, i.charAt(ii))) {
                return false;
            }
        }
        return true;
    });

    processIdiomList(idioms);

    console.log('--------------------------------------');
    console.log('the length of words ' + _.keys(words).length);
    console.log('the length of relations ' + _.keys(relations).length);
    console.log('the length of idioms ' + idioms.length);

    //_.forEach(idioms, function (i) { console.log(i); });

    var t = _(words).pairs().sortBy(function (w) { return -w[1]; }).map(function (w, index) {
        return {
            id: index,
            value: w[1],
            label: w[0]
        };
    }).value();

    var d = _.indexBy(t, 'label');
    var r = _(relations).pairs().sortBy(function (w) { return -w[1]; }).map(function (w) {
        return {
            from: d[w[0].charAt(0)].id,
            to: d[w[0].charAt(2)].id,
            value: w[1]
        }
    }).value();

    fs.writeFileSync(path.nodes, getJsonString('nodes', t));
    fs.writeFileSync(path.edges, getJsonString('edges', r));

    _.forEach(r, function (rr) {
        addEdgesToNode(t[rr.from], rr.to, rr.value);
        addEdgesToNode(t[rr.to], rr.from, rr.value);
    });

    fs.writeFileSync(path.nodes_json, JSON.stringify(t, null, 4));
    fs.writeFileSync(path.edges_json, JSON.stringify(r, null, 4));
    fs.writeFileSync(path.idioms_json, JSON.stringify(idioms, null, 4));
};

var addEdgesToNode = function (node, to, v) {
    if (_.isUndefined(node.connections)) {
        node.connections = {};
    }

    if (_.isUndefined(node.connections[to])) {
        node.connections[to] = v;
    } else {
        node.connections[to] += v;
    }
};

var getJsonString = function (name, data) {
    return 'var ' + name + ' = ' + JSON.stringify(data, null, 4) + ';'
};
