import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";

let schema_options = {
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
};

let schema = new Schema(Object.assign({
  label: {
    type: Schema.Types.String,
    trim: true,
    unique: true,
    required: true
  },
  actions: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'action',
        required: true
      }
    ],
    required: true
  },
}, BaseSchema), schema_options);

let modelSchema = model("privilege", schema);
export {modelSchema as Model};