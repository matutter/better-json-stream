module.exports.JSONStream = JSONStream

const Writable = require('stream').Writable;
const util = require('util')

/**
* Fast && efficient JSON stream parser
*/
function JSONStream() {
  Writable.call(this)
  this.trail_buffer = null
}
util.inherits(JSONStream, Writable)


JSONStream.prototype._write = function(buffer, enc, done) {
  var l = 0
  var r = 0

  var cursor = l
  var stack = 0
  var str = null

  if(this.trail_buffer)
    buffer = Buffer.concat([this.trail_buffer, buffer], this.trail_buffer.length + buffer.length)

  const len = buffer.length

  this.trail_buffer = null

  try {
    l = cursor = buffer.indexOf('{')
    while(~l && ~r) {

      // find first }
      r = buffer.indexOf('}', l+1)
      // find next {
      cursor = buffer.indexOf('{', cursor+1)

      // if cursor < r, that means the object is nested, increase stack until it's false
      while(cursor < r) {
        //console.log(cursor, r)
        stack++
        cursor = buffer.indexOf('{', cursor+1)
        if(cursor <= 0) break
      }

      r = buffer.lastIndexOf('}', cursor)

      if(r == -1) {
        if(l != len)
          this.trail_buffer = buffer.slice(l)
        break;
      }

      if(l < r) {
        str = buffer.slice(l, r+1).toString()
        //console.log(l, cursor, r, str)
        try {
          this.emit('object', JSON.parse(str))
        } catch(e) {
          this.emit('error', e)
        }
      } else { 
        break;
      }

      l = r+1
    }    
  } catch(e) {
    this.emit('error', e)
  } finally {
    if(!this.trail_buffer)
      this.emit('finish')
    done()
  }
};