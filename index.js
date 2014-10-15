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
var bcrypt = require('bcrypt');

/**
 * Check parameters and throw if type is incorrect, or length out of bounds.
 *
 * @param {mongodb.Collection} coll  throw if not a mongodb.Collection
 * @param {String} username  throw if not a String
 * @param {String} password  throw if not a String
 * @param {String} realm  throw if not a String
 * @param {Function} cb  throw if not a Function
 * @return {undefined}
 */
function _checkAllWithPassword(coll, username, password, realm, cb) {
  if (!(coll instanceof mongodb.Collection)) { throw new TypeError('coll must be an instance of mongodb.Collection'); }
  if (typeof username !== 'string') { throw new TypeError('username must be a string'); }
  if (typeof password !== 'string') { throw new TypeError('password must be a string'); }
  if (typeof realm !== 'string') { throw new TypeError('realm must be a string'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  if (username.length < 2) { throw new Error('username must be at least 2 characters'); }
  if (username.length > 128) { throw new Error('username can not exceed 128 characters'); }
  if (password.length < 6) { throw new TypeError('password must be at least 6 characters'); }
  if (realm.length < 1) { throw new Error('realm must be at least 1 character'); }
  if (realm.length > 128) { throw new Error('realm can not exceed 128 characters'); }
}

/**
 * Create a new User object. Either for maintenance, verification or registration.
 * A user may be bound to a realm.
 *
 * @param {mongodb.Collection} coll  the database that contains all user accounts
 * @param {String} username  the name of the user to bind this instance to
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 */
function User(coll, username, realm) {
  if (typeof realm === 'undefined') {
    realm = '_default';
  }

  _checkAllWithPassword(coll, username, 'xxxxxx', realm, function() {});

  this._coll = coll;
  this._realm = realm;
  this._username = username;
}
module.exports = User;

User._checkAllWithPassword = _checkAllWithPassword;


/////////////////////////////
//// Stateless functions ////
/////////////////////////////


/**
 * Return whether or not the user already exists in the database.
 *
 * @param {mongodb.Collection} coll  the database that contains all user accounts
 * @param {String} username  the username to check
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be an error or null, second parameter
 *                       contains a boolean about whether this user exists or not.
 */
function exists(coll, username, realm, cb) {
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }
  _checkAllWithPassword(coll, username, 'xxxxxx', realm, cb);

  var lookup = {
    realm: realm,
    username: username
  };

  coll.findOne(lookup, function(err, user) {
    if (err) { cb(err); return; }
    if (user) { cb(null, true); return; }
    cb(null, false);
  });
}
User.exists = exists;

/**
 * Verify if the given password is valid for the given username.
 *
 * @param {mongodb.Collection} coll  the database that contains all user accounts
 * @param {String} username  the username to use
 * @param {String} password  the password to verify
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be an error or null, second parameter
 *                       contains a boolean about whether the password is valid or
 *                       not.
 */
function isPasswordCorrect(coll, username, password, realm, cb) {
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }
  _checkAllWithPassword(coll, username, password, realm, cb);

  var lookup = {
    realm: realm,
    username: username
  };

  coll.findOne(lookup, function(err, user) {
    if (err) { cb(err); return; }

    if (!user) { cb(null, false); return; }

    bcrypt.compare(password, user.password, cb);
  });
}
User.isPasswordCorrect = isPasswordCorrect;

/**
 * Update the password for the given username.
 *
 * Note: the user has to exist in the database.
 *
 * @param {mongodb.Collection} coll  the database that contains all user accounts
 * @param {String} username  the username to use
 * @param {String} password  the password to use, at least 6 characters
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be either an error object or null on
 *                       success.
 */
function setPassword(coll, username, password, realm, cb) {
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }
  _checkAllWithPassword(coll, username, password, realm, cb);

  bcrypt.hash(password, 10, function(err, hash) {
    if (err) { cb(err); return; }

    var lookup = {
      realm: realm,
      username: username
    };

    coll.update(lookup, { $set: { password: hash } }, function(err, updated) {
      if (err) { cb(err); return; }

      if (updated !== 1) { cb(new Error('failed to update password')); return; }

      cb(null);
    });
  });
}
User.setPassword = setPassword;

/**
 * Register a new user with a certain password.
 *
 * @param {mongodb.Collection} coll  the database that contains all user accounts
 * @param {String} username  the username to use
 * @param {String} password  the password to use
 * @param {String, default: _default} [realm]  optional realm the user belongs to
 * @param {Function} cb  first parameter will be either an error object or null on
 *                       success.
 */
function register(coll, username, password, realm, cb) {
  if (typeof realm === 'function') {
    cb = realm;
    realm = '_default';
  }
  _checkAllWithPassword(coll, username, password, realm, cb);

  var user = {
    realm: realm,
    username: username
  };

  exists(coll, username, realm, function(err, doesExist) {
    if (doesExist) { cb(new Error('username already exists')); return; }

    coll.insert(user, function(err) {
      if (err) { cb(err); return; }

      setPassword(coll, username, password, realm, cb);
    });
  });
}
User.register = register;


/////////////////////////////////////////
//// Object methods of each function ////
/////////////////////////////////////////


/**
 * Wrapper around User.exists.
 *
 * @param {Function} cb  first parameter will be an error or null, second parameter
 *                       contains a boolean about whether this user exists.
 */
User.prototype.exists = function(cb) {
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  exists(this._coll, this._username, this._realm, cb);
};

/**
 * Wrapper around User.isPasswordCorrect.
 *
 * @param {String} password  the password to verify
 * @param {Function} cb  first parameter will be an error or null, second parameter
 *                       contains a boolean about whether the password is valid or
 *                       not.
 */
User.prototype.isPasswordCorrect = function(password, cb) {
  if (typeof password !== 'string') { throw new TypeError('password must be a string'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  isPasswordCorrect(this._coll, this._username, password, this._realm, cb);
};

/**
 * Wrapper around User.setPassword.
 *
 * Note: the user has to exist in the database.
 *
 * @param {String} password  the password to use
 * @param {Function} cb  first parameter will be either an error object or null on
 *                       success.
 */
User.prototype.setPassword = function(password, cb) {
  if (typeof password !== 'string') { throw new TypeError('password must be a string'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  setPassword(this._coll, this._username, password, this._realm, cb);
};

/**
 * Wrapper around User.register.
 *
 * @param {String} password  the password to use
 * @param {Function} cb  first parameter will be either an error object or null on
 *                       success.
 */
User.prototype.register = function(password, cb) {
  if (typeof password !== 'string') { throw new TypeError('password must be a string'); }
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  register(this._coll, this._username, password, this._realm, cb);
};
