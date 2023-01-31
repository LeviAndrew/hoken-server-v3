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
  title: {
    type: Schema.Types.String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: Schema.Types.String,
    trim: true,
  },
  files: {
    type: [{
      name: {
        type: Schema.Types.String,
        required: true,
      },
      path: {
        type: Schema.Types.String,
        required: true,
      },
      timestamp: {
        type: Schema.Types.Number,
        required: true,
      },
      sendBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    }],
    default: [],
  },
  sendDate: {
    type: Schema.Types.Number,
    required: true,
  },
  sendBy: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  }
}, schema_options);

export {schema};
