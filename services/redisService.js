'use strict';

var redis = require('redis');
var redisConfig = require('../config/redis').config.redis();
var client = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);
var prefix = redisConfig.prefix;

client.on('error', function (err) {
    console.log('redis error ' + err);
    process.exit(1);
});

var save = function (key, value, expireTimeMS, next) {
    key = prefix + key;
    if (typeof expireTimeMS == 'function' && typeof next == 'undefined') {
        next = expireTimeMS;
        expireTimeMS = null;
    }
    var expireTimeSeconds = null;
    var expireTimestamp = null;
    if (null != expireTimeMS) {
        expireTimeSeconds = Math.ceil(expireTimeMS / 1000);
        expireTimestamp = new Date().getTime() + expireTimeMS;
    }

    var cacheObj = {
        value: value,
        expireTimestamp: expireTimestamp,
        createdAt: new Date().getTime(),
        readAt: null
    };

    client.set(key, JSON.stringify(cacheObj), function (err) {
        if (err == null && expireTimeSeconds != null) {
            client.expire(key, expireTimeSeconds);
        }
        if (typeof next == 'function') {
            process.nextTick(function () {
                next(err, true);
            });
        }
    });
};

var get = function (key, cb) {
    key = prefix + key;

    client.get(key, function (err, v) {
        if (err) {
            cb(err);
        } else {
            if (v) {
                cb(null, JSON.parse(v).value);
            } else {
                cb(null, null);
            }
        }
    });
};

exports.redisService = {
    save: save,
    get: get
}
