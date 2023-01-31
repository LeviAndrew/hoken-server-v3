import * as Path from 'path';

import {Schema} from "mongoose";
import {schema as Answer} from './Answer';
const ENUM = require(Path.resolve('util/ENUMs.json'));

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
    trim: true,
    maxlength: [40, 'titleMaxlength'],
  },
  body: {
    type: Schema.Types.String,
    trim: true,
    required: [true, 'bodyRequired'],
  },
  grad: {
    type: Schema.Types.Number,
    min: [0, 'gradeMin'],
  },
  weight: {
    type: Schema.Types.Number,
    min: [0, 'gradeMin'],
    required: [true, "weightRequired"],
  },
  questionType: {
    type: Schema.Types.String,
    enum: ENUM.questionTypes,
    required: [true, "questionTypeRequired"],
  },
  answers: {
    type: [
        {
          type: Answer
        }
    ],
    default: [],
  }
}, schema_options);

export {schema};
