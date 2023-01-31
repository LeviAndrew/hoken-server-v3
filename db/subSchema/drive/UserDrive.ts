import {Schema} from "mongoose";
import {schema as FolderChild} from './FolderChild'

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
  canUpdate: {
    type: Schema.Types.Boolean,
    default: true,
  },
  hasRoot: {
    type: Schema.Types.Boolean,
    default: false,
  },
  root: {
    type: FolderChild,
  },
}, schema_options);

export {schema};
