/**
 * Ruby Marshal Decoder for Node.js
 * Supports Ruby Marshal format version 4.8
 * 
 * Format reference: https://docs.ruby-lang.org/en/master/marshal_rdoc.html
 */

const TYPE_NIL = 0x30;      // '0'
const TYPE_TRUE = 0x54;     // 'T'
const TYPE_FALSE = 0x46;    // 'F'
const TYPE_FIXNUM = 0x69;   // 'i'
const TYPE_FLOAT = 0x66;    // 'f'
const TYPE_BIGNUM = 0x6c;   // 'l'
const TYPE_STRING = 0x22;   // '"'
const TYPE_SYMBOL = 0x3a;   // ':'
const TYPE_SYMLINK = 0x3b;  // ';'
const TYPE_ARRAY = 0x5b;    // '['
const TYPE_HASH = 0x7b;     // '{'
const TYPE_HASH_DEF = 0x7d; // '}'
const TYPE_OBJECT = 0x6f;   // 'o'
const TYPE_LINK = 0x40;     // '@'
const TYPE_IVAR = 0x49;     // 'I'
const TYPE_EXTENDED = 0x65; // 'e'
const TYPE_UCLASS = 0x43;   // 'C'
const TYPE_REGEXP = 0x2f;   // '/'
const TYPE_DATA = 0x64;     // 'd'
const TYPE_STRUCT = 0x53;   // 'S'
const TYPE_MODULE = 0x6d;   // 'm'
const TYPE_CLASS = 0x63;    // 'c'
const TYPE_USRMARSHAL = 0x55; // 'U'
const TYPE_USERDEF = 0x75;  // 'u'

class MarshalDecoder {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.symbols = [];
    this.objects = [];
    this.warnings = [];
  }

  readByte() {
    if (this.offset >= this.buffer.length) {
      throw new Error(`Unexpected end of buffer at offset ${this.offset}`);
    }
    return this.buffer[this.offset++];
  }

  readBytes(n) {
    if (this.offset + n > this.buffer.length) {
      throw new Error(`Unexpected end of buffer at offset ${this.offset}, need ${n} bytes`);
    }
    const bytes = this.buffer.slice(this.offset, this.offset + n);
    this.offset += n;
    return bytes;
  }

  readFixnum() {
    const c = this.readByte();
    if (c === 0) return 0;
    
    // Signed byte interpretation
    const signed = c > 127 ? c - 256 : c;
    
    if (signed > 0) {
      if (signed <= 4) {
        // Read 'signed' bytes as little-endian positive number
        let result = 0;
        for (let i = 0; i < signed; i++) {
          result |= this.readByte() << (8 * i);
        }
        return result;
      }
      return signed - 5;
    } else {
      if (signed >= -4) {
        // Read '-signed' bytes as little-endian negative number
        const len = -signed;
        let result = -1;
        for (let i = 0; i < len; i++) {
          result &= ~(0xff << (8 * i));
          result |= this.readByte() << (8 * i);
        }
        return result;
      }
      return signed + 5;
    }
  }

  readString() {
    const len = this.readFixnum();
    return this.readBytes(len);
  }

  readSymbol() {
    const bytes = this.readString();
    const sym = bytes.toString('utf8');
    this.symbols.push(sym);
    return sym;
  }

  readSymlink() {
    const idx = this.readFixnum();
    if (idx >= this.symbols.length) {
      throw new Error(`Invalid symbol link index ${idx}`);
    }
    return this.symbols[idx];
  }

  registerObject(obj) {
    this.objects.push(obj);
    return obj;
  }

  decode() {
    const type = this.readByte();
    
    switch (type) {
      case TYPE_NIL:
        return null;
        
      case TYPE_TRUE:
        return true;
        
      case TYPE_FALSE:
        return false;
        
      case TYPE_FIXNUM:
        return this.readFixnum();
        
      case TYPE_FLOAT: {
        const bytes = this.readString();
        const str = bytes.toString('utf8');
        if (str === 'inf') return Infinity;
        if (str === '-inf') return -Infinity;
        if (str === 'nan') return NaN;
        return parseFloat(str);
      }
        
      case TYPE_BIGNUM: {
        const sign = this.readByte();
        const len = this.readFixnum() * 2; // Length in shorts, convert to bytes
        const bytes = this.readBytes(len);
        let result = 0n;
        for (let i = len - 1; i >= 0; i--) {
          result = result * 256n + BigInt(bytes[i]);
        }
        if (sign === 0x2d) { // '-'
          result = -result;
        }
        // Convert to Number if safe, otherwise keep BigInt
        if (result >= Number.MIN_SAFE_INTEGER && result <= Number.MAX_SAFE_INTEGER) {
          return Number(result);
        }
        return result;
      }
        
      case TYPE_STRING: {
        const bytes = this.readString();
        const str = bytes.toString('utf8');
        // Register the string object for potential back-references
        this.registerObject(str);
        return str;
      }
        
      case TYPE_SYMBOL:
        return this.readSymbol();
        
      case TYPE_SYMLINK:
        return this.readSymlink();
        
      case TYPE_ARRAY: {
        const len = this.readFixnum();
        const arr = [];
        this.registerObject(arr);
        for (let i = 0; i < len; i++) {
          arr.push(this.decode());
        }
        return arr;
      }
        
      case TYPE_HASH:
      case TYPE_HASH_DEF: {
        const len = this.readFixnum();
        const hash = {};
        this.registerObject(hash);
        for (let i = 0; i < len; i++) {
          const key = this.decode();
          const value = this.decode();
          // Handle symbol keys
          const keyStr = typeof key === 'string' ? key : 
                        (key && key.value) ? key.value : String(key);
          hash[keyStr] = value;
        }
        if (type === TYPE_HASH_DEF) {
          hash.__default__ = this.decode();
        }
        return hash;
      }
        
      case TYPE_OBJECT: {
        const className = this.decode();
        const obj = { __class__: className };
        this.registerObject(obj);
        const len = this.readFixnum();
        for (let i = 0; i < len; i++) {
          const key = this.decode();
          const value = this.decode();
          // Remove @ prefix from instance variables
          const keyStr = typeof key === 'string' ? key.replace(/^@/, '') : String(key);
          obj[keyStr] = value;
        }
        return obj;
      }
        
      case TYPE_LINK: {
        const idx = this.readFixnum();
        if (idx >= this.objects.length) {
          throw new Error(`Invalid object link index ${idx}`);
        }
        return this.objects[idx];
      }
        
      case TYPE_IVAR: {
        const obj = this.decode();
        const len = this.readFixnum();
        
        // For strings with ivars (encoding info), just skip the ivars and return the string
        if (typeof obj === 'string') {
          for (let i = 0; i < len; i++) {
            this.decode(); // key
            this.decode(); // value
          }
          return obj;
        }
        
        // For other objects, attach the ivars
        if (obj && typeof obj === 'object') {
          for (let i = 0; i < len; i++) {
            const key = this.decode();
            const value = this.decode();
            const keyStr = typeof key === 'string' ? key.replace(/^@/, '') : String(key);
            obj[keyStr] = value;
          }
        }
        return obj;
      }
        
      case TYPE_EXTENDED: {
        const moduleName = this.decode();
        const obj = this.decode();
        if (obj && typeof obj === 'object') {
          obj.__extended__ = moduleName;
        }
        return obj;
      }
        
      case TYPE_UCLASS: {
        const className = this.decode();
        const obj = this.decode();
        if (obj && typeof obj === 'object') {
          obj.__uclass__ = className;
        }
        return obj;
      }
        
      case TYPE_REGEXP: {
        const source = this.readString().toString('utf8');
        const options = this.readByte();
        const obj = { __type__: 'Regexp', source, options };
        return this.registerObject(obj);
      }
        
      case TYPE_DATA: {
        const className = this.decode();
        const data = this.decode();
        const obj = { __class__: className, __type__: 'Data', data };
        return this.registerObject(obj);
      }
        
      case TYPE_STRUCT: {
        const className = this.decode();
        const obj = { __class__: className, __type__: 'Struct' };
        this.registerObject(obj);
        const len = this.readFixnum();
        for (let i = 0; i < len; i++) {
          const key = this.decode();
          const value = this.decode();
          const keyStr = typeof key === 'string' ? key : String(key);
          obj[keyStr] = value;
        }
        return obj;
      }
        
      case TYPE_MODULE:
      case TYPE_CLASS: {
        const name = this.readString().toString('utf8');
        const obj = { 
          __type__: type === TYPE_MODULE ? 'Module' : 'Class',
          name 
        };
        return this.registerObject(obj);
      }
        
      case TYPE_USRMARSHAL: {
        const className = this.decode();
        const data = this.decode();
        const obj = { __class__: className, __type__: 'UserMarshal', data };
        return this.registerObject(obj);
      }
        
      case TYPE_USERDEF: {
        const className = this.decode();
        const bytes = this.readString();
        const obj = { 
          __class__: className, 
          __type__: 'UserDef', 
          data: bytes,
          dataHex: bytes.toString('hex')
        };
        return this.registerObject(obj);
      }
        
      default:
        throw new Error(`Unknown Marshal type: 0x${type.toString(16)} (${String.fromCharCode(type)}) at offset ${this.offset - 1}`);
    }
  }
}

/**
 * Decode Ruby Marshal data
 * @param {Buffer} buffer - The marshal data buffer
 * @returns {Object} - Decoded object and metadata
 */
export function decode(buffer) {
  if (buffer.length < 2) {
    throw new Error('Buffer too short for Marshal data');
  }
  
  const major = buffer[0];
  const minor = buffer[1];
  
  if (major !== 4 || minor !== 8) {
    throw new Error(`Unsupported Marshal version ${major}.${minor}, expected 4.8`);
  }
  
  const decoder = new MarshalDecoder(buffer.slice(2));
  const data = decoder.decode();
  
  return {
    version: `${major}.${minor}`,
    data,
    warnings: decoder.warnings,
    symbolCount: decoder.symbols.length,
    objectCount: decoder.objects.length
  };
}

/**
 * Check file signature and determine format
 * @param {Buffer} buffer - First bytes of file
 * @returns {Object} - Format info
 */
export function detectFormat(buffer) {
  if (buffer.length < 2) {
    return { format: 'unknown', error: 'Buffer too short' };
  }
  
  // Check for Ruby Marshal signature
  if (buffer[0] === 0x04 && buffer[1] === 0x08) {
    return {
      format: 'ruby-marshal',
      version: '4.8',
      signature: buffer.slice(0, 2).toString('hex')
    };
  }
  
  // Check for zlib (magic number 0x78)
  if (buffer[0] === 0x78) {
    return {
      format: 'zlib-compressed',
      signature: buffer.slice(0, 2).toString('hex')
    };
  }
  
  // Check for gzip (magic number 0x1f 0x8b)
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return {
      format: 'gzip-compressed',
      signature: buffer.slice(0, 2).toString('hex')
    };
  }
  
  return {
    format: 'unknown',
    signature: buffer.slice(0, Math.min(16, buffer.length)).toString('hex')
  };
}

export default { decode, detectFormat };
