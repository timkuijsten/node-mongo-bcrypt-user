/**
 * Copyright (c) 2014 Tim Kuijsten
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

var mongodb = require('mongodb');

/**
 * Open a database connection using the provided configuration.
 *
 * @param {Object} config  database configuration containing dbName, dbHost and 
 *                         dbPort.
 * @param {Function} cb  first parameter is an error object or null, second
 *                       parameter is the database connection.
 *
 * config:
 *  dbName
 *  dbHost, defaults to 127.0.0.1
 *  dbPort, defaults to 27017
 *  dbUser
 *  dbPass
 *  authDb
 */
module.exports = function(config, cb) {
  if (typeof config !== 'object') { throw new TypeError('config must be an object'); }
  if (typeof config.dbName !== 'string') { throw new TypeError('config.dbName must be a string'); }

  config.dbHost = config.dbHost || '127.0.0.1';
  if (typeof config.dbHost !== 'string') { throw new TypeError('config.dbHost must be a string'); }

  config.dbPort = config.dbPort || 27017;
  if (typeof config.dbPort !== 'number') { throw new TypeError('config.dbPort must be a number'); }

  var db = new mongodb.Db(config.dbName, new mongodb.Server(config.dbHost, config.dbPort), { w: 1 });

  db.open(function(err) {
    if (err) { return cb(err); }

    if (config.dbUser || config.dbPass) {
      var authDb = db.db(config.authDb || config.dbName);
      authDb.authenticate(config.dbUser, config.dbPass, function(err) {
        cb(err, db);
      });
    } else {
      cb(null, db);
    }
  });
};
