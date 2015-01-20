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
