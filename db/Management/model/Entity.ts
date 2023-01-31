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
    unique: true,
    required: true
  },
  firstName: {
    type: Schema.Types.String,
    trim: true,
  },
  parents: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'entity',
      }
    ],
    default: [],
  },
  children: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'entity',
      }
    ],
    default: [],
  },
  modules: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'module',
        required: true
      }
    ],
  },
  users: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'user',
      }
    ],
  },
  visible: {
    type: Schema.Types.Boolean,
    default: true,
    required: true
  },
  activate: {
    type: Schema.Types.Boolean,
    default: true,
    required: true
  },
  initialDate: {
    type: Schema.Types.Number,
  },
  endDate: {
    type: Schema.Types.Number,
  },
  supportResources: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'supportResource',
      }
    ],
  },
  collaborativeWork: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'collaborativeWork'
      }
    ]
  },
  tests: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'test'
      }
    ],
  }
}, BaseSchema), schema_options);

let modelSchema = model("entity", schema);
export {modelSchema as Model};