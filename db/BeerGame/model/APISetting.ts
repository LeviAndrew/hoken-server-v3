import {model, Schema} from "mongoose"
import {BaseSchema} from "../../BaseSchema"

const
  schema_options = {
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
      name: {
        type: Schema.Types.String,
        trim: true,
        required: [true, 'name.required'],
      },
      url: {
        type: Schema.Types.String,
        trim: true,
        required: [true, 'url.required'],
      },
      email: {
        type: Schema.Types.String,
        trim: true,
        required: [true, 'email.required'],
      },
      apiKey: {
        type: Schema.Types.String,
        trim: true,
        required: [true, 'url.required'],
        unique: true,
      },
    },
    ...BaseSchema,
  }, schema_options),
  modelSchema = model("apiSetting", schema);
export {modelSchema as Model};