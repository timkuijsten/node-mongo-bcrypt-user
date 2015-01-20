/**
 * Copyright (c) 2014, 2015 Tim Kuijsten
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
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
