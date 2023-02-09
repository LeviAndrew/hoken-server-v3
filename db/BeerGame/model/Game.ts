import {model, Schema} from "mongoose"
import {BaseSchema} from "../../BaseSchema"
import {
  TeamBeerGame,
  GameSetting,
} from '../../subSchema'

const schema_options = {
    timestamps: true,
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  },
  schema = new Schema({
    ...{
      gameSetting: {
        type: GameSetting,
        required: [true, 'gameSetting.required'],
      },
      teacher: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'teacher.required'],
      },
      teams: {
        type: [{
          type: TeamBeerGame,
        }],
        required: [true, 'teams.required'],
      },
      gameStatus: {
        type: Schema.Types.String,
        default: 'created',
        enum: ['created', 'started', 'paused', 'finished'],
      },
      pin: {
        type: Schema.Types.String,
        required: [true, 'pin.required'],
      },
    },
    ...BaseSchema,
  }, schema_options),
  modelSchema = model("game", schema);
export {modelSchema as Model};