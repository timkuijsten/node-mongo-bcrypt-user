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
  describe('constructor', function () {
    it('should require coll to be an object', function() {
      (function() { User.find(''); }).should.throw('coll must be an object');
    });
    // assume all checks are handled by the bcrypt-user parent
  });

  describe('register', function () {
    it('should register', function(done) {
      User.register(coll, 'baz', 'p4ssword', 'ooregister', function(err, user) {
        should.strictEqual(err, null);
        should.strictEqual(user._realm, 'ooregister');
        should.strictEqual(user._username, 'baz');

        // bcrypt password example: '$2a$10$VnQeImV1DVqtQ7hXa.Sgsug9cCLVa65W4jO09w.I5tXcuYRbRVevu'
        should.strictEqual(user._password.length, 60);
        user._password.should.match(/^\$2a\$10\$/);

        bcrypt.compare('p4ssword', user._password, function(err, res) {
          if (err) { throw err; }
          if (res !== true) { throw new Error('passwords don\'t match'); }

          // compare object saved in database with returned object
          coll.findOne({ realm: 'ooregister', username: 'baz' }, function(err, usr2) {
            should.strictEqual(err, null);
            should.strictEqual(usr2._realm, user.realm);
            should.strictEqual(usr2._username, user.username);
            should.strictEqual(usr2._password, user.password);
            done();
          });
        });
      });
    });
  });

  describe('find', function () {
    // use previously created user
    it('should find the user', function(done) {
      User.find(coll, 'baz', 'ooregister', function(err, user) {
        if (err) { throw err; }
        should.strictEqual(user._realm, 'ooregister');
        should.strictEqual(user._username, 'baz');
        done();
      });
    });
  });

  describe('verifyPassword', function () {
    // use previously created user

    it('should find that the password is invalid', function(done) {
      User.find(coll, 'baz', 'ooregister', function(err, user) {
        if (err) { throw err; }
        user.verifyPassword('secret', function(err, correct) {
          if (err) { throw err; }
          should.strictEqual(correct, false);
          done();
        });
      });
    });

    it('should find that the password is valid', function(done) {
      User.find(coll, 'baz', 'ooregister', function(err, user) {
        if (err) { throw err; }
        user.verifyPassword('p4ssword', function(err, correct) {
          if (err) { throw err; }

          should.strictEqual(correct, true);

          coll.findOne({ username: 'baz', realm: 'ooregister' }, function(err, usr2) {
            if (err) { throw err; }

            // compare object saved in database with returned object
            should.strictEqual(usr2.realm, 'ooregister');
            should.strictEqual(usr2.username, 'baz');
            done();
          });
        });
      });
    });
  });

  describe('setPassword', function () {
    // use previously created user

    it('should update the password', function(done) {
      User.find(coll, 'baz', 'ooregister', function(err, user) {
        if (err) { throw err; }
        user.setPassword('secret', function(err) {
          if (err) { throw err; }
          coll.findOne({ username: 'baz', realm: 'ooregister' }, function(err, usr) {
            should.strictEqual(err, null);
            should.strictEqual(usr.realm, 'ooregister');
            should.strictEqual(usr.username, 'baz');

            // bcrypt password example: '$2a$10$VnQeImV1DVqtQ7hXa.Sgsug9cCLVa65W4jO09w.I5tXcuYRbRVevu'
            should.strictEqual(usr.password.length, 60);
            usr.password.should.match(/^\$2a\$10\$/);

            bcrypt.compare('secret', usr.password, function(err, res) {
              if (err) { throw err; }
              if (res !== true) { throw new Error('passwords don\'t match'); }
              done();
            });
          });
        });
      });
    });

    it('should require that the user exists in the given realm (wrong realm)', function(done) {
      User.find(coll, 'baz', 'ooregister2', function(err, user) {
        if (err) { throw err; }
        user.setPassword('secret', function(err) {
          should.strictEqual(err.message, 'failed to update password');
          done();
        });
      });
    });

    it('should require that the user exists in the given realm (wrong username)', function(done) {
      User.find(coll, 'baz', 'ooregister2', function(err, user) {
        if (err) { throw err; }
        user.setPassword('secret', function(err) {
          should.strictEqual(err.message, 'failed to update password');
          done();
        });
      });
    });
  });
});
