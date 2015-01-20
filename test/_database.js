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
var async = require('async');

var _db = require('./_db');
var createCappedCollection = require('./_create_capped_coll');

/**
 * Open one or more database connections.
 *
 * @param {Array|String} databaseNames  a single name or an array of database names
 */
function Database(databaseNames) {
  if (typeof databaseNames !== 'string' && !Array.isArray(databaseNames)) { throw new TypeError('databaseNames must be an array or a string'); }

  // always cast to array
  if (typeof databaseNames === 'string') {
    this._singleString = true;
    databaseNames = [databaseNames];
  }

  if (databaseNames.length < 1) { throw new TypeError('databaseNames must contain at least one name'); }

  this._databaseNames = databaseNames;
  this._config = require('./test.json');
}

module.exports = Database;

/**
 * Drop provided database.
 *
 * @param {mongodb.Db} db  database to drop
 * @param {Function} cb  first parameter is an error or null
 */
Database.prototype._dropDatabase = function _dropDatabase(db, cb) {
  if (!(db instanceof mongodb.Db)) { throw new TypeError('db must be a mongodb.Db'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  db.dropDatabase(function(err) {
    if (err && err.message !== 'ns not found' && !/^Collection .* not found/.test(err.message)) { cb(err); return; }
    cb(null);
  });
};

/**
 * Setup connections to all databases and callback with all the connections. If a
 * single string was provided as database name on setup, callback with one
 * connection, otherwise callback with an array of connections.
 *
 * @param {Function} cb  first parameter is an error or null. second parameter the
 *                       database connection or an array of connections.
 */
Database.prototype.connect = function connect(cb) {
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  var that = this;

  var cfg = {
    dbName: this._databaseNames[0],
    dbHost: this._config.dbHost,
    dbPort: this._config.dbPort
  };

  // setup connections to all dbs
  _db(cfg, function(err, db) {
    if (err) { cb(err); return; }
    that._dbs = [];
    async.eachSeries(that._databaseNames, function(dbName, cb2) {
      var ndb = db.db(dbName);
      that._dbs.push(ndb);
      // cleanup database before use
      that._dropDatabase(ndb, cb2);
    }, function(err) {
      if (that._singleString) {
        cb(err, that._dbs[0]);
      } else {
        cb(err, that._dbs);
      }
    });
  });
};

/**
 * Drop all databases and close connections.
 *
 * @param {Function} cb  first parameter is an error or null.
 */
Database.prototype.disconnect = function(cb) {
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  var that = this;

  // drop each database before closing
  async.eachSeries(that._dbs, function(db, cb2) {
    that._dropDatabase(db, cb2);
  }, function(err) {
    if (err) { cb(err); return; }

    // close connection
    that._dbs[0].close(function(err) {
      if (err) { cb(err); return; }
      that._dbs = [];
      cb(null);
    });
  });
};

/**
 * Create a capped collection on the first provided database.
 *
 * @param {mongodb.Db} [db]  database connection to use, defaults to first
 *                           connection
 * @param {String} collectionName  name of the capped collection to create
 * @param {Function} cb  first parameter is an error or null.
 */
Database.prototype.createCappedColl = function createCappedColl(db, collectionName, cb) {
  if (typeof db === 'string') {
    cb = collectionName;
    collectionName = db;
    db = this._dbs[0];
  }

  if (!(db instanceof mongodb.Db)) { throw new TypeError('db must be a mongodb.Db'); }
  if (typeof collectionName !== 'string') { throw new TypeError('collectionName must be a string'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  createCappedCollection(db, collectionName, function(err) {
    if (err) { cb(err); return; }

    // look at vc._clearSnapshot for the right index name
    db.createIndex(collectionName, { '_id._id': 1, '_id._pe': 1, '_id._i': -1 }, { name: '_id_i' }, function(err) {
      if (err) { throw err; }
      db.collection(collectionName).indexes(cb);
    });
  });
};
