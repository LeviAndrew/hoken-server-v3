import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {
  Document,
  Entity,
  UserDrive
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
  drive: {
    type: UserDrive,
  },
  name: {
    type: Schema.Types.String,
    trim: true,
    required: true
  },
  surname: {
    type: Schema.Types.String,
    trim: true,
    required: true
  },
  birthday: {
    type: Schema.Types.Number,
  },
  email: {
    type: Schema.Types.String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: Schema.Types.String,
    required: true,
    trim: true,
  },
  authenticationKey: {
    type: Schema.Types.String,
    required: true,
    unique: true,
    trim: true,
  },
  matriculation: {
    type: Schema.Types.String,
    unique: true,
    trim: true,
  },
  document: {
    type: Document,
    required: true
  },
  entities: {
    type: [
      {
        type: Entity,
        required: true
      }
    ],
    required: true
  },
  emails: {
    type:[{
      type:Schema.Types.ObjectId,
      ref: 'directMessage',
    }]
  }
}, BaseSchema), schema_options);

let modelSchema = model("user", schema);
export {modelSchema as Model};