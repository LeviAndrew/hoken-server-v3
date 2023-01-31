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
  name: {
    type: Schema.Types.String,
    trim: true,
    required: true,
  },
  description: {
    type: Schema.Types.String,
    maxlength: 2000,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'entity',
    required: true,
  },
  file: {
    type: Schema.Types.ObjectId,
    ref: 'file',
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  folder: {
    type: Schema.Types.ObjectId,
    ref: 'folder',
  },
  externalLink: {
    type: Schema.Types.ObjectId,
    ref: 'externalLink',
  },
  initDate: {
    type: Schema.Types.Number,
  },
  endDate: {
    type: Schema.Types.Number,
  },
  visibility: {
    type: Schema.Types.Boolean,
    default: true,
    required: true
  }
}, BaseSchema), schema_options);

let modelSchema = model("supportResource", schema);
export {modelSchema as Model};