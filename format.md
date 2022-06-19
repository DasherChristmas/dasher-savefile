# `.dasher` file format specs.

> See `uint.ts` for custom `Uint` types. Note the difference in capitalization between `UInt` and `Uint` used here.

## v1.0

### Header

| Byte Index | Type     | Use                                                                             |
| ---------- | -------- | ------------------------------------------------------------------------------- |
| 0          | `Uint8`  | Major Version - Should be `1`.                                                  |
| 1          | `Uint8`  | Minor Version - Should be `0` until updates are made.                           |
| 2          | `Uint32` | Header Length (in bytes) - Equal to `6` + length of the path to the media file. |
| 6          | `string` | Media File Path - Path to the audio file.                                       |

### Model Blocks

> Byte indices are from the start of the model's block.

| Byte Index | Type     | Use                                                                            |
| ---------- | -------- | ------------------------------------------------------------------------------ |
| 0          | `Uint32` | Header Length - Equal to `4` + the length of the model ID.                     |
| 4          | `Uint16` | Layer Count - The number of effect layes the model has in this sequence.       |
| 6          | `string` | Model ID - a string ID pointing to the model, which is saved in the sequencer. |

The rest of the block consists of the number of Layer Blocks specified by `Layer Count`.

### Layer Blocks

> Byte indices are from the start of the layer's block.

| Byte Index | Type     | Use                                    |
| ---------- | -------- | -------------------------------------- |
| 0          | `Uint32` | Effect Count - Number of Effect Blocks |

The rest of the block consists of the number of Effect Blocks specified by `Effect Count`.

### Effect Blocks

> Byte indices are from the start of the effect's block.

| Byte Index | Type     | Use                                                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------- |
| 0          | `Uint32` | Block Length - The length of the effect block, or `22` + length of the effect ID + length of effect data. |
| 4          | `Uint16` | Data Start - The index at which the effect data starts.                                                   |
| 6          | `BigInt` | Start Frame - The frame that the effect's range starts on.                                                |
| 14         | `BigInt` | End Frame - The frame that the effect's range ends on.                                                    |
| 22         | `string` | Effect ID - The Unique ID of the effect used in the editor.                                               |

The rest of the block is dedicated to a `JSON` string that contains the input data for the effect, which tarts at byte indicated by `Data Start`.

> Note that Effect IDs for custom effects loaded locally (rather than installed through the effects store) may have conflicting ids with effects on other PCs when sharing sequences.
