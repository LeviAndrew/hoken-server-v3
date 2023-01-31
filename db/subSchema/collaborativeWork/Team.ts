import {Schema} from "mongoose";
import {schema as Answer} from './Answer'
import {schema as Participant} from './Participant'

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
  participants: {
    type: [
      {
        type: Participant,
      }
    ],
    required: true,
  },
  answers: {
    type: [
      {
        type: Answer,
        required: true,
      }
    ],
    required: true,
  },
}, schema_options);

export {schema};
