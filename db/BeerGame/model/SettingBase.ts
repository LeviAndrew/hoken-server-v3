import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";

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
    async: {
      type: Schema.Types.Boolean,
      default: false,
      required: [true, 'async.required'],
    },
    timer: {
      type: Schema.Types.Boolean,
      default: true,
      required: [true, 'timer.required'],
    },
    time: {
      type: Schema.Types.Number,
      default: 45,
      min: 10,
    },
    playersPerTeam: {
      type: Schema.Types.Number,
      min: 4,
    },
    isDefault: {
      type: Schema.Types.Boolean,
      default: false,
      required: [true, 'isDefault.required'],
    },
    ...BaseSchema,
  }, schema_options),
  modelSchema = model("settingBase", schema);
export {modelSchema as Model};