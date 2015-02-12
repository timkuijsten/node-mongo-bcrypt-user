# mongo-bcrypt-user

Store and verify users with bcrypt passwords located in a mongodb collection.

## Examples

Create a new user named "foo" in the "user" collection with the password "secr3t".

    var mongodb = require('mongodb');
    var User = require('mongo-bcrypt-user');

    // assume "db" is a mongodb.Db object
    var coll = db.collection('users');

    User.register(coll, 'baz', 'ooregister', 'p4ssword', function(err, user) {
      if (err) { throw err; }
      console.log('user created');
    });

Check if the password "raboof" is correct for user "foo" in the realm "bar".

    // same setup as previous example

    User.find(coll, 'baz', 'ooregister', function(err, user) {
      user.verifyPassword('raboof', function(err, correct) {
        if (err) { throw err; }
        if (correct === true) {
          console.log('password correct');
        } else {
          console.log('password incorrect');
        }
      });
    });

## Installation

    $ npm install mongo-bcrypt-user

## API

#### new User(coll, username, [realm])
* coll {Object} instance of mongodb.Collection that contains all user accounts
* username {String} the name of the user to bind this instance to
* realm {String, default: _default} optional realm the user belongs to

Store and verify users with bcrypt passwords located in a mongodb collection.

#### user.exists(cb)
* cb {Function} first parameter will be an error or null, second parameter
  contains a boolean about whether this user exists or not.

Return whether or not the user already exists in the database.

#### user.verifyPassword(password, cb)
* password {String} the password to verify
* cb {Function} first parameter will be an error or null, second parameter
  contains a boolean about whether the password is valid or not. Third parameter
  constains the user object if the password is correct.

Verify if the given password is valid.

#### user.setPassword(password, cb)
* password {String} the password to use
* cb {Function} first parameter will be either an error object or null on success.

Update the password.

Note: the user has to exist in the database.

#### user.register(password, cb)
* password {String} the password to use, at least 6 characters
* cb {Function} first parameter will be either an error object or null on success.
  Second parameter constains the user object that is created.

Register a new user with a certain password.

## Tests

    $ npm test

## License

ISC

Copyright (c) 2014, 2015 Tim Kuijsten

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
