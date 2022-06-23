import { parse, build } from "./saveFile";

let buffer = build({
  version: {
    major: 1,
    minor: 0
  },
  mediaFile: "./path/to/music.mp3",
  models: [
    {
      modelID: "some-nonexistient-model",
      layers: [
        {
          zIdx: 0,
          effects: [
            {
              effectID: "some-effect-id",
              startFrame: 0n,
              endFrame: 50n,
              effectData: {
                someOption: "some value"
              }
            },
            {
              effectID: "idk",
              startFrame: 80n,
              endFrame: 85n,
              effectData: {}
            }
          ]
        },
        {
          zIdx: 1,
          effects: [
            {
              effectID: "some-other-effect-id",
              startFrame: 50n,
              endFrame: 75n,
              effectData: {
                someOtherOption: "some other value"
              }
            }
          ]
        }
      ]
    },
    {
      modelID: "model2",
      layers: [
        {
          zIdx: 99,
          effects: [
            {
              effectID: "model2-effect",
              startFrame: 0n,
              endFrame: 99999n,
              effectData: {
                whayNot: false
              }
            }
          ]
        }
      ]
    }
  ]
});

console.log(
  buffer,
  "\n\n",
  JSON.stringify(
    parse(buffer),
    (k, v) => {
      if (typeof v === "bigint") {
        return v.toString() + "n";
      }
      return v;
    },
    2
  )
);
