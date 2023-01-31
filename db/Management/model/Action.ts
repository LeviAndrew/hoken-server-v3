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
  label: {
    type: Schema.Types.String,
    trim: true,
    required: true
  },
  name: {
    type: Schema.Types.String,
    trim: true,
    required: true,
    unique: true,
  },
  methods: {
    type: [
      {
        type: Schema.Types.String,
        trim: true,
        required: true
      }
    ],
  },
}, BaseSchema), schema_options);

let modelSchema = model("action", schema);
export {modelSchema as Model};