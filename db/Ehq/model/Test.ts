import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {
  TestQuestion
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
  instructions: {
    type: Schema.Types.String,
    trim: true
  },
  initialDate: {
    type: Schema.Types.Date,
    required: [true, 'initialDateRequired'],
    index: true,
  },
  endDate: {
    type: Schema.Types.Date,
    required: [true, 'endDateRequired']
  },
  title: {
    type: Schema.Types.String,
    trim: true,
    required: [true, 'titleRequired']
  },
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'entity',
    index: true,
    required: [true, 'entityIdRequired'],
  },
  monitors: {
      type: [
          {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: [true, 'monitorsRequired'],
          }
      ]
  },
  students: {
      type: [
          {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: [true, 'studentsRequired'],
          }
      ]
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    trim: true,
    required: true
  },
  questions: {
    type: [
        {
          type: TestQuestion,
          // required: [true, 'questionRequired'],
        }
    ]
  },
}, BaseSchema), schema_options);

let modelSchema = model("test", schema);
export {modelSchema as Model};