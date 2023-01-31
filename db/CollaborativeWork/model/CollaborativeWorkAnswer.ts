// @ts-ignore-file
import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {Team} from '../../subSchema'

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
  initialDate: {
    type: Schema.Types.Number,
  },
  endDate: {
    type: Schema.Types.Number,
  },
  maxPerTeam: {
    type: Schema.Types.Number,
    required: true,
    default: 1,
  },
  teams: {
    type: [
      {
        type: Team,
      }
    ],
    default: [],
  }
}, BaseSchema), schema_options);

let modelSchema = model("collaborativeWorkAnswer", schema);
export {modelSchema as Model};