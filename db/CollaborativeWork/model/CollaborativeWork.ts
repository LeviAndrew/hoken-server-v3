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
    trim: true,
    maxlength: 2000,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'entity',
    index: true,
    required: true,
  },
  file: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'file',
      }
    ]
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  externalLink: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'externalLink',
      }
    ],
  },
  initVisibilityDate: {
    type: Schema.Types.Number,
  },
  endVisibilityDate: {
    type: Schema.Types.Number,
  },
  public: {
    type: Schema.Types.Boolean,
    default: false,
    required: true,
  },
  answer: {
    type: Schema.Types.ObjectId,
    ref: 'collaborativeWorkAnswer',
    required: true,
  }
}, BaseSchema), schema_options);

let modelSchema = model("collaborativeWork", schema);
export {modelSchema as Model};