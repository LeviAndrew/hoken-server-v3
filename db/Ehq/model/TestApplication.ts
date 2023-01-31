import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {
  TestAnswer
} from '../../subSchema'

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
  test: {
    type: Schema.Types.ObjectId,
    ref: 'test',
    required: [true, 'studentRequired']
  },
  grade: {
    type: Schema.Types.Number,
    min: [0, 'gradeMin'],
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    trim: true,
    required: true
  },
  answers: {
    type: [
        {
          type: TestAnswer,
          trim: true,
          required: true
        }
    ],
    default: [],
  },
}, BaseSchema), schema_options);

let modelSchema = model("testApplication", schema);
export {modelSchema as Model};