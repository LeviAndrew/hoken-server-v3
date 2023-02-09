import {Schema} from "mongoose";
import {schema as Player} from './Player'

const
  schema_options = {
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
  },
  schema = new Schema({
    nick: {
      type: Schema.Types.String,
      trim: true,
      required: [true, 'nick.required'],
    },
    players: {
      type: [{
        type: Player,
      }],
    },
  }, schema_options);

export {schema};
