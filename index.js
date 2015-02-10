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

/**
 * Register a new user with a certain password.
 *
 * @param {Object} coll  throw if not an object
 * @param {String} username  the username to use
 * @param {String} password  the password to use
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be either an error object or null on
 *                       success, second parameter will be either a user object or
 *                       null on failure.
 */
function register(coll, username, password, realm, cb) {
  if (typeof coll !== 'object') { throw new TypeError('coll must be an object'); }
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }

  var user = new User(coll, username, realm);
  user.register(password, function(err) {
    if (err) { cb(err); return }

    cb(null, user);
  });
}

function find(coll, username, realm, cb) {
  if (typeof coll !== 'object') { throw new TypeError('coll must be an object'); }
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }

  var user = new User(coll, username, realm);
  user.find(function(err) {
    if (err) { cb(err); return }

    cb(null, user);
  });
}

util.inherits(User, BcryptUser);
module.exports = User;

User.register = register;
User.find = find;
