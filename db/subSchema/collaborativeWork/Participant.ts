import {Schema} from "mongoose";

const
  schema_options = {
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        return ret;
      }
    }
  },
  schema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    accepted: {
      type: Schema.Types.Boolean,
      default: false,
    },
  }, schema_options);

export {schema};
