import fs from "fs";

namespace V1 {
  interface Effect {
    startFrame: bigint;
    endFrame: bigint;
    effectID: string;
    effectData: {
      [key: string]: any;
    };
  }

  interface Layer {
    zIdx: number;
    effects: Effect[];
  }

  interface Model {
    modelID: string;
    layers: Layer[];
  }

  export interface SaveData {
    version: {
      major: number;
      minor: number;
    };
    mediaFile: string;
    models: Model[];
  }

  function checkMinor(ver: number) {
    return [0].includes(ver);
  }

  export function canParse(buffer: Buffer) {
    return buffer.readUInt8(0) === 1 && checkMinor(buffer.readUInt8(1));
  }

  function parseEffect(
    buffer: Buffer,
    initialOffset: number,
    next: (n?: number) => number
  ): Effect {
    let offset = initialOffset;

    const blockLength = buffer.readUInt32LE(offset);
    offset = next(4);

    const dataStart = buffer.readUInt16LE(offset);
    offset = next(2);

    const startFrame = buffer.readBigUInt64LE(offset);
    offset = next(8);

    const endFrame = buffer.readBigUInt64LE(offset);
    offset = next(8);

    const effectID = buffer
      .subarray(offset, initialOffset + dataStart)
      .toString("utf-8");
    offset = next(initialOffset + dataStart - offset);

    const dataArray = buffer.subarray(offset, initialOffset + blockLength);

    const effectData = JSON.parse(dataArray.toString("utf-8"));
    offset = next(dataArray.byteLength);

    if (
      ((d: any): d is { [key: string]: any } => {
        return typeof d === "object";
      })(effectData)
    ) {
      return {
        startFrame,
        endFrame,
        effectID,
        effectData
      };
    }

    return {
      startFrame,
      endFrame,
      effectID,
      effectData: {}
    };
  }

  function parseLayer(
    buffer: Buffer,
    initialOffset: number,
    next: (n?: number) => number
  ): Layer {
    let offset = initialOffset;

    const effectCount = buffer.readBigUInt64LE(offset);
    offset = next(8);

    const zIdx = buffer.readUInt16LE(offset);
    offset = next(2);

    let effects: Effect[] = [];
    for (let i = 0n; i < effectCount; i += 1n) {
      effects.push(
        parseEffect(buffer, offset, (n?: number) => (offset = next(n)))
      );
    }

    return {
      zIdx,
      effects
    };
  }

  function parseModel(
    buffer: Buffer,
    initialOffset: number,
    next: (n?: number) => number
  ): Model {
    let offset = initialOffset;
    const headerLength = buffer.readUInt32LE(offset);
    offset = next(4);
    const layerCount = buffer.readUInt16LE(offset);
    offset = next(2);
    const modelID = buffer
      .subarray(offset, initialOffset + headerLength)
      .toString("utf-8");
    offset = next(initialOffset + headerLength - offset);

    let layers: Layer[] = [];
    for (let i = 0; i < layerCount; i++) {
      layers.push(
        parseLayer(buffer, offset, (n?: number) => (offset = next(n)))
      );
    }

    return {
      modelID,
      layers
    };
  }

  export function parse(buffer: Buffer): SaveData {
    const version = {
      major: 1,
      minor: buffer.readUInt8(1)
    };
    const headerLength = buffer.readUInt32LE(2);
    const modelCount = buffer.readUInt32LE(6);
    const mediaFile = buffer.subarray(10, headerLength).toString("utf-8");

    let offset = headerLength;
    const next = (n: number = 1) => (offset += n);

    let models: Model[] = [];
    for (let i = 0; i < modelCount; i++) {
      models.push(parseModel(buffer, offset, next));
    }

    return {
      version,
      mediaFile,
      models
    };
  }

  export function canBuild(data: SaveData): boolean {
    return data.version.major === 1 && checkMinor(data.version.minor);
  }

  function buildEffect(effect: Effect): Buffer {
    const dataString = JSON.stringify(effect.effectData);
    const dataStart = 22 + effect.effectID.length;
    const blockLength = dataStart + dataString.length;
    const buffer = Buffer.alloc(blockLength);
    buffer.writeUInt32LE(blockLength, 0);
    buffer.writeUInt16LE(dataStart, 4);
    buffer.writeBigUInt64LE(effect.startFrame, 6);
    buffer.writeBigUInt64LE(effect.endFrame, 14);
    buffer.write(effect.effectID, 22);
    buffer.write(dataString, dataStart);
    return buffer;
  }

  function buildLayer(layer: Layer): Buffer {
    const header = Buffer.alloc(10);
    header.writeBigUInt64LE(BigInt(layer.effects.length), 0);
    header.writeUInt16LE(layer.zIdx, 8);

    let effects = layer.effects.map(buildEffect);

    const buffer = Buffer.alloc(effects.reduce((p, n) => p + n.byteLength, 10));
    header.copy(buffer);

    let offset = 10;
    for (let effect of effects) {
      effect.copy(buffer, offset);
      offset += effect.byteLength;
    }

    return buffer;
  }

  function buildModel(model: Model): Buffer {
    const headerLength = 6 + model.modelID.length;
    const header = Buffer.alloc(headerLength);
    header.writeUInt32LE(headerLength, 0);
    header.writeUInt16LE(model.layers.length, 4);
    header.write(model.modelID, 6);

    let layers = model.layers.map(buildLayer);

    const buffer = Buffer.alloc(
      layers.reduce((p, n) => p + n.byteLength, headerLength)
    );
    header.copy(buffer);

    let offset = headerLength;
    for (let layer of layers) {
      layer.copy(buffer, offset);
      offset += layer.byteLength;
    }

    return buffer;
  }

  export function build(data: SaveData): Buffer {
    const headerLength = 10 + data.mediaFile.length;
    const header = Buffer.alloc(headerLength);
    header.writeUInt8(data.version.major, 0);
    header.writeUInt8(data.version.minor, 1);
    header.writeUInt32LE(headerLength, 2);
    const modelCount = data.models.length;
    header.writeUInt32LE(modelCount, 6);
    header.write(data.mediaFile, 10, "utf-8");

    let models = data.models.map(buildModel);

    const buffer = Buffer.alloc(
      models.reduce((p, n) => p + n.byteLength, headerLength)
    );
    header.copy(buffer);

    let offset = headerLength;
    for (let model of models) {
      model.copy(buffer, offset);
      offset += model.byteLength;
    }

    return buffer;
  }
}

export type SaveData = V1.SaveData;

const versions = [V1] as const;

export function parse(buf: Buffer): SaveData {
  for (let ver of versions) {
    if (ver.canParse(buf)) {
      return ver.parse(buf);
    }
  }

  throw new SyntaxError("Invalid Save File.");
}

export function parseFile(path: string): SaveData {
  return parse(fs.readFileSync(path));
}

export async function parseFileAsync(path: string): Promise<SaveData> {
  return parse(
    await new Promise((resolve, reject) =>
      fs.readFile(path, (err, buf) => {
        if (err) reject(err);
        else resolve(buf);
      })
    )
  );
}

export function build(data: SaveData): Buffer {
  for (let ver of versions) {
    if (ver.canBuild(data)) {
      return ver.build(data);
    }
  }

  throw new TypeError("Invalid SaveData Object.");
}
