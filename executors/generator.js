'use strict';

var _ = require('lodash');
var S = require('string');
var fs = require("fs");
var path = require('../config/data').config.data();

var nodes = require('../data/nodes.json');
var edges = require('../data/edges.json');
var idioms = require('../data/idioms.json');

var NODE_LIMIT = 30;
var selected = {};
var candidate = {};
var used = {};

var seed = _(nodes).first(10000).sample(1).value()[0];
while (_.size(selected) < NODE_LIMIT) {
    selected[seed.label] = 1;
    used[seed.id] = 1;
    delete candidate[seed.id];

    if (!_.isUndefined(seed.connections)) {
        _.forEach(seed.connections, function (v, k) {
            var w = nodes[parseInt(k)];
            var vv = v + _.random(1000);

            if (_.isUndefined(used[w.id])) {
                if (_.isUndefined(candidate[w.id])) {
                    candidate[w.id] = vv;
                } else {
                    candidate[w.id] += vv;
                }
            }
        });
    }

    seed = _(candidate).map(function (v, k) {
        return {
            k: k,
            v: v
        };
    }).max(function (v) {
        return v.v;
    }).value().k;
    seed = nodes[seed];
}

console.log(_.size(selected));
console.log(_.keys(selected));

idioms = _.filter(idioms, function (i) {
    for (var ii = 0; ii < i.length; ii++) {
        if (_.isUndefined(selected[i.charAt(ii)])) {
            return false;
        }
    }
    return true;
});

var words = {};
var relations = {};

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

var getJsonString = function (name, data) {
    return 'var ' + name + ' = ' + JSON.stringify(data, null, 4) + ';'
};

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

console.log('done');
_.forEach(idioms, function (i) { console.log(i); });
