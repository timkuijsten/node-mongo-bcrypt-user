# mongo-bcrypt-user

Create user accounts, verify and update passwords using bcrypt. The library can be
used in a stateless way or in an object oriented way.

## Examples
### object oriented

Create a new user named "foo" in the "user" collection with the password "secr3t".

    var mongodb = require('mongodb');
    var User = require('mongo-bcrypt-user');

    // assume "db" is a mongodb.Db object
    var coll = db.collection('users');

    var user = new User(coll, 'foo');
    user.register('secr3t', function(err) {
      if (err) { throw err; }
      console.log('user created');
    });

Check if the password "raboof" is correct for user "foo" in the realm "bar".

    // same setup as previous example

    var user = new User(coll, 'foo', 'bar');
    user.isPasswordCorrect('raboof', function(err, correct) {
      if (err) { throw err; }
      if (correct === true) {
        console.log('password correct');
      } else {
        console.log('password incorrect');
      }
    });

### stateless

Create a new user named "foo" in the "user" collection with the password "secr3t".

    var mongodb = require('mongodb');
    var User = require('mongo-bcrypt-user');

    // assume "db" is a mongodb.Db object
    var coll = db.collection('users');

    User.register(coll, 'foo', 'secr3t', function(err) {
      if (err) { throw err; }
      console.log('user created');
    });

Check if the password "raboof" is correct for user "foo" in the realm "bar".

    // same setup as previous example

    User.isPasswordCorrect(coll, 'foo', 'raboof', 'bar', function(err, correct) {
      if (err) { throw err; }
      if (correct === true) {
        console.log('password correct');
      } else {
        console.log('password incorrect');
      }
    });

## Installation

    $ npm install mongo-bcrypt-user

## API
### object oriented

#### new User(coll, username, [realm])
Create a new User object. Either for maintenance, verification or registration.
A user may be bound to a realm.

* @param {mongodb.Collection} coll  the database that contains all user accounts
* @param {String} username  the name of the user to bind this instance to
* @param {String, default: _default} [realm]  optional realm the user belongs to

#### user.exists(cb)
Return whether or not the user already exists in the database.

* @param {Function} cb  first parameter will be an error or null, second parameter
                        contains a boolean about whether this user exists or not.

#### user.isPasswordCorrect(password, cb)
Verify if the given password is valid.

* @param {String} password  the password to verify
* @param {Function} cb  first parameter will be an error or null, second parameter
                        contains a boolean about whether the password is valid or
                        not.

#### user.setPassword(password, cb)
Update the password.

Note: the user has to exist in the database.

* @param {String} password  the password to use
* @param {Function} cb  first parameter will be either an error object or null on
                        success.

#### user.register(password, cb)
Register a new user with a certain password.

* @param {String} password  the password to use
* @param {Function} cb  first parameter will be either an error object or null on
                        success.

### stateless

Furthermore a stateless variant of each object oriented function is available
where the collection object, the username and optionally the realm are given at
each function invocation.

#### User.exists(coll, username, [realm], cb)
#### User.isPasswordCorrect(coll, username, password, [realm], cb)
#### User.setPassword(coll, username, password, [realm], cb)
#### User.register(coll, username, password, [realm], cb)

## License

MIT, see LICENSE
