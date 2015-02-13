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
 * Store and verify users with bcrypt passwords located in a mongodb collection.
 *
 * @param {Object} coll  the database that contains all user accounts
 * @param {String} username  the name of the user to bind this instance to
 * @param {Object} [opts]  object containing optional parameters
 *
 * opts:
 *  realm {String, default "_default"}  optional realm the user belongs to
 *  debug {Boolean, default false} whether to do extra console logging or not
 *  hide {Boolean, default false} whether to suppress errors or not (for testing)
 */
function User(coll, username, opts) {
  if (typeof coll !== 'object') { throw new TypeError('coll must be an object'); }
  if (typeof username !== 'string') { throw new TypeError('username must be a string'); }

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

  BcryptUser.call(this, db, username, opts || {});
}

util.inherits(User, BcryptUser);
module.exports = User;

/**
 * Create a new user with a certain password and save it to the database.
 *
 * @param {Object} coll  instance of mongodb.Collection that contains all users
 * @param {String} username  the username to use
 * @param {String} password  the password to use
 * @param {String, default "_default"} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be either an error object or null on
 *                       success, second parameter will be either a user object or
 *                       undefined on failure.
 */
User.register = function register(coll, username, password, realm, cb) {
  if (typeof coll !== 'object') { throw new TypeError('coll must be an object'); }
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }

  var user = new User(coll, username, { realm: realm });
  user.register(password, function(err) {
    if (err) { cb(err); return; }

    cb(null, user);
  });
};

/**
 * Find and return a user from the database.
 *
 * @param {Object} coll  instance of mongodb.Collection that contains all users
 * @param {String} username  the username to use
 * @param {String, default "_default"} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be an error or null, second parameter
 *                       will be the user object or undefined.
 */
User.find = function find(coll, username, realm, cb) {
  if (typeof coll !== 'object') { throw new TypeError('coll must be an object'); }
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }

  var user = new User(coll, username, { realm: realm });
  user.find(function(err) {
    if (err) { cb(err); return; }

    cb(null, user);
  });
};
