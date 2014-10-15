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

/**
 * Creates a capped collection.
 *
 * @param {mongodb.Db] db  database connection
 * @param {String} oplogCollection  name of the collection to create
 * @param {Function} cb  first parameter error or null
 */
function createCappedColl(db, oplogCollection, cb) {
  if (typeof cb !== 'function') { throw new TypeError('cb must be a function'); }

  db.dropCollection(oplogCollection, function(err) {
    if (err) {
      if (err.message !== 'ns not found' && !/^Collection .* not found/.test(err.message)) {
        console.error('ERROR createCappedColl drop', err);
        return cb(err);
      }
    }
    db.createCollection(oplogCollection, {
      autoIndexId: true,
      capped: true,
      size: 1000,
      strict: true,
      w: 1
    }, function(err) {
      if (err) {
        console.error('ERROR createCappedColl create', err);
        return cb(err);
      }
      cb();
    });
  });
}

module.exports = createCappedColl;
