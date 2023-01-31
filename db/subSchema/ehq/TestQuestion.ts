import * as Path from 'path';

import {Schema} from "mongoose";
import {schema as Answer} from './Answer'

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
    maxlength: [40, 'titleMaxlength'],
    trim: true,
  },
  body: {
    type: Schema.Types.String,
    required: [true, "bodyRequired"],
    trim: true,
  },
  author: {
    type: Schema.Types.String,
    required: [true, 'authorRequired']
  },
  weight: {
    type: Schema.Types.Number,
    required: [true, 'weightRequired']
  },
  questionType: {
    type: Schema.Types.String,
    enum: ENUM.questionTypes,
    required: [true, 'typeRequired'],
    trim: true,
  },
  correctAnswers: {
    type: [{
      type: Answer,
    }],
    required: [true, 'incorrectAnswersRequired'],
  },
  incorrectAnswers: {
    type: [{
      type: Answer
    }],
    default: [],
  }
}, schema_options);

export {schema};
