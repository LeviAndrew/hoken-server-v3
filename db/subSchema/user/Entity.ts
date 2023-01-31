import {Schema} from "mongoose";

let schema_options = {
  _id: false,
  id: false,
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
  date: {
    type: Schema.Types.Number,
    required: true
  },
  entity: {
    type: Schema.Types.ObjectId,
    ref: 'entity',
    required: true
  },
  privileges: {
    type: Schema.Types.ObjectId,
    ref: 'privilege',
    required: true
  }
}, schema_options);

export {schema};
