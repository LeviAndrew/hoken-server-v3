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
  folders: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'folder'
    }],
    default: [],
  },
  files: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'file',
    }],
    default: [],
  },
  externalLinks: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'externalLink',
    }],
    default: [],
  },
}, schema_options);

export {schema};
