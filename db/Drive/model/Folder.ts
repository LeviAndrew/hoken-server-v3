import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {
  FolderChild
} from '../../subSchema'

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
  name: {
    type: Schema.Types.String,
    trim: true,
    required: true
  },
  path: {
    type: Schema.Types.String,
    trim: true,
    required: true
  },
  date: {
    type: Schema.Types.Number,
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  child: {
    type: FolderChild,
  }
}, BaseSchema), schema_options);

let modelSchema = model("folder", schema);
export {modelSchema as Model};