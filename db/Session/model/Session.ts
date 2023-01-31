import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {MainEntity} from '../../subSchema'

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
  accessKey: {
    type: Schema.Types.String,
    trim: true,
    unique: true,
    required: true,
  },
  mainEntities: {
    type: [
      {
        type: MainEntity,
      }
    ],
  },
}, BaseSchema), schema_options);

let modelSchema = model("session", schema);
export {modelSchema as Model};