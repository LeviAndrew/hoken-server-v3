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
  message: {
    type: Schema.Types.String,
    required: false
  },
  attachments: {
    type: [{
      type: Schema.Types.String
    }],
    required: false
  },
}, schema_options);

export {schema};
