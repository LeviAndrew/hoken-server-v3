import {Schema} from "mongoose";

let schema_options = {
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
};

let schema = new Schema({
  privilege: {
    type: Schema.Types.ObjectId,
    ref: 'privilege',
    required: true,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'entity',
    required: true
  },
  mappedChildren: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'entity',
        required: true
      }
    ],
    default: [],
  }
}, schema_options);

export {schema};
