import {Schema} from "mongoose";

let schema = {
  id: {
    type: Schema.Types.String,
    required: true,
    trim: true,
    index: true,
  },
  removed: {
    type: Schema.Types.Boolean,
    default: false,
    index: true,
  },
};

export {schema as BaseSchema}