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

var util = require('util');
var BcryptUser = require('bcrypt-user');

/**
 * Check parameters and throw if type is incorrect, or length out of bounds.
 *
 * @param {Object} coll  throw if not an object
 * @param {String} username  throw if not a String
 * @param {String} password  throw if not a String
 * @param {String} realm  throw if not a String
 * @param {Function} cb  throw if not a Function
 * @return {undefined}
 */
function _checkAllWithPassword(coll, username, password, realm, cb) {
  if (typeof coll !== 'object') { throw new TypeError('coll must be an object'); }
  BcryptUser._checkAllWithPassword(coll, username, password, realm, cb);
}

/**
 * Store and verify users with bcrypt passwords located in a mongodb collection.
 *
 * @param {Object} coll  the database that contains all user accounts
 * @param {String} username  the name of the user to bind this instance to
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 */
function User(coll, username, realm) {
  if (typeof realm === 'undefined') {
    realm = '_default';
  }

  _checkAllWithPassword(coll, username, 'xxxxxx', realm, function() {});

  // setup a resolver
  var db = {
    find: coll.findOne.bind(coll),
    insert: coll.insert.bind(coll),
    updateHash: function(lookup, hash, cb) {
      coll.update(lookup, { $set: { password: hash } }, function(err, updated) {
        if (err) { cb(err); return; }

        if (updated !== 1) { cb(new Error('failed to update password')); return; }

        cb(null);
      });
    }
  };

  BcryptUser.call(this, db, username, realm);

  this._db = db;
  this._realm = realm;
  this._username = username;
}
util.inherits(User, BcryptUser);
module.exports = User;

User._checkAllWithPassword = _checkAllWithPassword;
