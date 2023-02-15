import {model, Schema} from "mongoose"
import {BaseSchema} from "../../BaseSchema"
import {
  TeamLogisGame,
  SettingLogisGame,
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
        type: SettingLogisGame,
        required: [true, 'gameSetting.required'],
      },
      teacher: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'teacher.required'],
      },
      teams: {
        type: [{
          type: TeamLogisGame,
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
  modelSchema = model("gameLogis", schema);
export {modelSchema as Model};