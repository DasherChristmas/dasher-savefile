abstract class Uint {
  numValue: number = 0;
  abstract clamp: boolean;
  abstract numCap: number;
  abstract stringTag: string;
  add(num: Uint | number) {
    if (typeof num === "number") {
      this.numValue += num;
    } else {
      this.numValue += num.numValue;
    }
    this.fix();
    return this;
  }
  subtract(num: Uint | number) {
    if (typeof num === "number") {
      this.numValue -= num;
    } else {
      this.numValue -= num.numValue;
    }
    this.fix();
    return this;
  }
  multiply(num: Uint | number) {
    if (typeof num === "number") {
      this.numValue *= num;
    } else {
      this.numValue *= num.numValue;
    }
    this.fix();
    return this;
  }
  divide(num: Uint | number) {
    if (typeof num === "number") {
      this.numValue /= num;
    } else {
      this.numValue /= num.numValue;
    }
    this.fix();
    return this;
  }
  from(num: number) {
    this.numValue = num;
    return this.fix();
  }
  toNum(): number {
    return this.numValue;
  }

  /* Shorthands */
  a(n: Uint | number) {
    return this.add(n);
  }
  s(n: Uint | number) {
    return this.subtract(n);
  }
  m(n: Uint | number) {
    return this.multiply(n);
  }
  d(n: Uint | number) {
    return this.divide(n);
  }
  f(n: number) {
    return this.from(n);
  }
  n(): number {
    return this.toNum();
  }

  /* Native */
  valueOf(): number {
    return this.n();
  }
  toString(): string {
    return `${this.stringTag}(${this.n()})`;
  }
  [Symbol.toStringTag]() {
    return this.stringTag;
  }

  /* Private */
  private fix(): typeof this {
    if (Math.floor(this.numValue) !== this.numValue)
      this.numValue = Math.floor(this.numValue);
    if (this.numValue > this.numCap) {
      if (this.clamp) this.numValue = this.numCap;
      else while (this.numValue > this.numCap) this.numValue -= this.numCap + 1;
    } else if (this.numValue < 0) {
      if (this.clamp) this.numValue = 0;
      else while (this.numValue < 0) this.numValue += this.numCap + 1;
    }
    return this;
  }
}

class Uint4 extends Uint {
  clamp = false;
  numCap = maxInt(4);
  stringTag = "Uint4";
}

class Uint4Clamped extends Uint4 {
  clamp = true;
  stringTag = "Uint4Clamped";
}

class Uint8 extends Uint {
  clamp = false;
  numCap = maxInt(8);
  stringTag = "Uint8";
}

class Uint8Clamped extends Uint8 {
  clamp = true;
  stringTag = "Uint8Clamped";
}

class Uint16 extends Uint {
  clamp = false;
  numCap = maxInt(16);
  stringTag = "Uint16";
}

class Uint16Clamped extends Uint16 {
  clamp = true;
  stringTag = "Uint16Clamped";
}

class Uint24 extends Uint {
  clamp = false;
  numCap = maxInt(24);
  stringTag = "Uint24";
}

class Uint24Clamped extends Uint24 {
  clamp = true;
  stringTag = "Uint24Clamped";
}

class Uint32 extends Uint {
  clamp = false;
  numCap = maxInt(32);
  stringTag = "Uint32";
}

class Uint32Clamped extends Uint32 {
  clamp = true;
  stringTag = "Uint32Clamped";
}

class Uint64 extends Uint {
  clamp = false;
  numCap = maxInt(64);
  stringTag = "Uint64";
}

class Uint64Clamped extends Uint64 {
  clamp = true;
  stringTag = "Uint64Clamped";
}

/* Oddball */
class Uint12 extends Uint {
  clamp = false;
  numCap = maxInt(12);
  stringTag = "Uint12";
}

function maxInt(bitNum: number): number {
  return 2 ** bitNum - 1;
}

namespace UintUtils {
  export let endianness: "big" | "little" = "little";
  export function combineUint4(a: Uint4, b: Uint4): Uint8 {
    return new Uint8().f((a.n() << 4) + b.n());
  }
  export function toBytes(n: Uint): Buffer {
    let byteCount = Math.log2(n.numCap + 1);
    let buf = Buffer.alloc(byteCount);
    let left = n.n();
    let byte = 0;
    while (left > 0) {
      buf[byte] = left & 0x0f;
      left >> 8;
      byte++;
    }

    if (endianness === "big")
      buf.copy(buf.subarray(0, buf.length).reverse(), 0);

    return buf;
  }
}

// Change endianness with `UintUtils.endianness = "big"`;

export {
  Uint4,
  Uint4Clamped,
  Uint8,
  Uint8Clamped,
  Uint16,
  Uint16Clamped,
  Uint24,
  Uint24Clamped,
  Uint32,
  Uint32Clamped,
  Uint64,
  Uint64Clamped,
  Uint12,
  UintUtils
};
