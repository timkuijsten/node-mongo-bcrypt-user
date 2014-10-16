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

/*jshint -W068 */

var should = require('should');
var bcrypt = require('bcrypt');

var User = require('../index');

var db, coll;
var databaseName = 'test_user';
var Database = require('./_database');

// open database connection
var database = new Database(databaseName);
before(function(done) {
  database.connect(function(err, dbc) {
    db = dbc;
    coll = db.collection('users');
    done(err);
  });
});

after(database.disconnect.bind(database));

describe('User', function () {
  describe('_checkAllWithPassword', function () {
    it('should require coll to be an object', function() {
      (function() { User._checkAllWithPassword(''); }).should.throw('coll must be an object');
    });

    it('should require username to be a string', function() {
      (function() { User._checkAllWithPassword(coll); }).should.throw('username must be a string');
    });

    it('should require password to be a string', function() {
      (function() { User._checkAllWithPassword(coll, ''); }).should.throw('password must be a string');
    });

    it('should require realm to be a string', function() {
      (function() { User._checkAllWithPassword(coll, '', ''); }).should.throw('realm must be a string');
    });

    it('should require cb to be a function', function() {
      (function() { User._checkAllWithPassword(coll, '', '', ''); }).should.throw('cb must be a function');
    });

    it('should require username to be at least 2 characters', function() {
      (function() { User._checkAllWithPassword(coll, 'a', '', '', function() {}); }).should.throw('username must be at least 2 characters');
    });

    it('should require username to not exceed 128 characters', function() {
      var username = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      (function() { User._checkAllWithPassword(coll, username, '', '', function() {}); }).should.throw('username can not exceed 128 characters');
    });

    it('should require password to be at least 6 characters', function() {
      (function() { User._checkAllWithPassword(coll, 'foo', 'fubar', '', function() {}); }).should.throw('password must be at least 6 characters');
    });

    it('should require realm to be at least 1 character', function() {
      (function() { User._checkAllWithPassword(coll, 'foo', 'raboof', '', function() {}); }).should.throw('realm must be at least 1 character');
    });

    it('should require realm to not exceed 128 characters', function() {
      var realm = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      (function() { User._checkAllWithPassword(coll, 'foo', 'raboof', realm, function() {}); }).should.throw('realm can not exceed 128 characters');
    });

    it('should not throw', function() {
      User._checkAllWithPassword(coll, 'foo', 'raboof', 'bar', function() {});
    });
  });

  describe('stateless', function () {
    describe('register', function () {
      it('should require coll to be an object', function() {
        (function() { User.register(''); }).should.throw('coll must be an object');
      });
      // assume all checks are handled by the previously tested User._checkAllWithPassword

      it('should register', function(done) {
        User.register(coll, 'bar', 'password', function(err) {
          should.strictEqual(err, null);
          coll.findOne({ username: 'bar', realm: '_default' }, function(err, user) {
            should.strictEqual(err, null);
            should.strictEqual(user.realm, '_default');
            should.strictEqual(user.username, 'bar');

            // bcrypt password example: '$2a$10$VnQeImV1DVqtQ7hXa.Sgsug9cCLVa65W4jO09w.I5tXcuYRbRVevu'
            should.strictEqual(user.password.length, 60);
            user.password.should.match(/^\$2a\$10\$/);

            bcrypt.compare('password', user.password, function(err, res) {
              if (err) { throw err; }
              if (res !== true) { throw new Error('passwords don\'t match'); }
              done();
            });
          });
        });
      });

      it('should fail if username already exists', function(done) {
        User.register(coll, 'bar', 'password', function(err) {
          should.strictEqual(err.message, 'username already exists');
          done();
        });
      });
    });

    describe('exists', function () {
      it('should require coll to be an object', function() {
        (function() { User.exists(''); }).should.throw('coll must be an object');
      });
      // assume all checks are handled by the previously tested User._checkAllWithPassword

      it('should find that the user does not exist', function(done) {
        User.exists(coll, 'foo', function(err, doesExist) {
          if (err) { throw err; }
          should.strictEqual(doesExist, false);
          done();
        });
      });

      it('needs a user to exist', function(done) {
        User.register(coll, 'foo', 'password', done);
      });

      it('should find that the user does exist', function(done) {
        User.exists(coll, 'foo', function(err, doesExist) {
          if (err) { throw err; }
          should.strictEqual(doesExist, true);
          done();
        });
      });

      it('should find that the user does exist in this realm', function(done) {
        User.exists(coll, 'foo', 'otherRealm', function(err, doesExist) {
          if (err) { throw err; }
          should.strictEqual(doesExist, false);
          done();
        });
      });
    });

    describe('verifyPassword', function () {
      it('should require coll to be an object', function() {
        (function() { User.verifyPassword(''); }).should.throw('coll must be an object');
      });
      // assume all checks are handled by the previously tested User._checkAllWithPassword

      it('needs a user to exist', function(done) {
        User.register(coll, 'foo', 'secr3t', 'verifyPasswordRealm', done);
      });

      it('should find that the password is invalid', function(done) {
        User.verifyPassword(coll, 'foo', 'secret', 'verifyPasswordRealm', function(err, valid) {
          if (err) { throw err; }
          should.strictEqual(valid, false);
          done();
        });
      });

      it('should find that the password is valid', function(done) {
        User.verifyPassword(coll, 'foo', 'secr3t', 'verifyPasswordRealm', function(err, valid) {
          if (err) { throw err; }
          should.strictEqual(valid, true);
          done();
        });
      });

      it('should find that the password is invalid for non-existant users', function(done) {
        User.verifyPassword(coll, 'foo2', 'secr3t', function(err, valid) {
          if (err) { throw err; }
          should.strictEqual(valid, false);
          done();
        });
      });

      it('should find that the password is invalid for users in non-existant realms', function(done) {
        User.verifyPassword(coll, 'foo', 'secr3t', 'verifyPasswordRealm2', function(err, valid) {
          if (err) { throw err; }
          should.strictEqual(valid, false);
          done();
        });
      });
    });

    describe('setPassword', function () {
      it('should require coll to be an object', function() {
        (function() { User.setPassword(''); }).should.throw('coll must be an object');
      });
      // assume all checks are handled by the previously tested User._checkAllWithPassword

      it('needs a user to exist', function(done) {
        User.register(coll, 'foo', 'secr3t', 'setPasswordRealm', done);
      });

      it('should update the password', function(done) {
        User.setPassword(coll, 'foo', 'secret', 'setPasswordRealm', function(err) {
          if (err) { throw err; }
          coll.findOne({ username: 'foo', realm: 'setPasswordRealm' }, function(err, user) {
            should.strictEqual(err, null);
            should.strictEqual(user.realm, 'setPasswordRealm');
            should.strictEqual(user.username, 'foo');

            // bcrypt password example: '$2a$10$VnQeImV1DVqtQ7hXa.Sgsug9cCLVa65W4jO09w.I5tXcuYRbRVevu'
            should.strictEqual(user.password.length, 60);
            user.password.should.match(/^\$2a\$10\$/);

            bcrypt.compare('secret', user.password, function(err, res) {
              if (err) { throw err; }
              if (res !== true) { throw new Error('passwords don\'t match'); }
              done();
            });
          });
        });
      });

      it('should require that the user exists in the given realm (wrong realm)', function(done) {
        User.setPassword(coll, 'foo', 'secret', 'setPasswordRealm2', function(err) {
          should.strictEqual(err.message, 'failed to update password');
          done();
        });
      });

      it('should require that the user exists in the given realm (wrong username)', function(done) {
        User.setPassword(coll, 'baz', 'secret', 'setPasswordRealm', function(err) {
          should.strictEqual(err.message, 'failed to update password');
          done();
        });
      });
    });
  });

  describe('object oriented', function () {
    describe('constructor', function () {
      it('should require coll to be an object', function() {
        (function() { var user = new User(''); return user; }).should.throw('coll must be an object');
      });
      // assume all checks are handled by the previously tested User._checkAllWithPassword
    });

    describe('register', function () {
      it('should register', function(done) {
        var user = new User(coll, 'baz', 'ooregister');
        user.register('p4ssword', function(err) {
          should.strictEqual(err, null);
          coll.findOne({ realm: 'ooregister', username: 'baz' }, function(err, usr) {
            should.strictEqual(err, null);
            should.strictEqual(usr.realm, 'ooregister');
            should.strictEqual(usr.username, 'baz');

            // bcrypt password example: '$2a$10$VnQeImV1DVqtQ7hXa.Sgsug9cCLVa65W4jO09w.I5tXcuYRbRVevu'
            should.strictEqual(usr.password.length, 60);
            usr.password.should.match(/^\$2a\$10\$/);

            bcrypt.compare('p4ssword', usr.password, function(err, res) {
              if (err) { throw err; }
              if (res !== true) { throw new Error('passwords don\'t match'); }
              done();
            });
          });
        });
      });
    });

    describe('exists', function () {
      // use previously created user
      it('should find that the user does exist', function(done) {
        var user = new User(coll, 'baz', 'ooregister');
        user.exists(function(err, doesExist) {
          if (err) { throw err; }
          should.strictEqual(doesExist, true);
          done();
        });
      });
    });

    describe('verifyPassword', function () {
      // use previously created user

      it('should find that the password is invalid', function(done) {
        var user = new User(coll, 'baz', 'ooregister');
        user.verifyPassword('secret', function(err, correct) {
          if (err) { throw err; }
          should.strictEqual(correct, false);
          done();
        });
      });

      it('should find that the password is valid', function(done) {
        var user = new User(coll, 'baz', 'ooregister');
        user.verifyPassword('p4ssword', function(err, correct) {
          if (err) { throw err; }
          should.strictEqual(correct, true);
          done();
        });
      });
    });

    describe('setPassword', function () {
      // use previously created user

      it('should update the password', function(done) {
        var user = new User(coll, 'baz', 'ooregister');
        user.setPassword('secret', function(err) {
          if (err) { throw err; }
          coll.findOne({ username: 'baz', realm: 'ooregister' }, function(err, user) {
            should.strictEqual(err, null);
            should.strictEqual(user.realm, 'ooregister');
            should.strictEqual(user.username, 'baz');

            // bcrypt password example: '$2a$10$VnQeImV1DVqtQ7hXa.Sgsug9cCLVa65W4jO09w.I5tXcuYRbRVevu'
            should.strictEqual(user.password.length, 60);
            user.password.should.match(/^\$2a\$10\$/);

            bcrypt.compare('secret', user.password, function(err, res) {
              if (err) { throw err; }
              if (res !== true) { throw new Error('passwords don\'t match'); }
              done();
            });
          });
        });
      });

      it('should require that the user exists in the given realm (wrong realm)', function(done) {
        var user = new User(coll, 'baz', 'ooregister2');
        user.setPassword('secret', function(err) {
          should.strictEqual(err.message, 'failed to update password');
          done();
        });
      });

      it('should require that the user exists in the given realm (wrong username)', function(done) {
        var user = new User(coll, 'foo', 'ooregister');
        user.setPassword('secret', function(err) {
          should.strictEqual(err.message, 'failed to update password');
          done();
        });
      });
    });
  });
});
