import {model, Schema} from "mongoose";
import {BaseSchema} from "../../BaseSchema";
import {
  Subject
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
  sendBy:{
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  sendTo: {
    type:[{
      type:Schema.Types.ObjectId,
      ref: 'user'
    }],
    required: true
  },
  entityId: {
    type:[{
      type:Schema.Types.ObjectId,
      ref: 'entity'
    }],
    required: true
  },
  title: {
    type: Schema.Types.String,
    trim: true,
    required: true
  },
  subject:{
    type: Subject,
    required: true
  },
  sendDate:{
    type: Schema.Types.Number,
  },
  scheduledDate:{
    type: Schema.Types.Number,
  },
  hasAttachment:{
    type: Schema.Types.Boolean,
    default: false
  }
}, BaseSchema), schema_options);

let modelSchema = model("directMessage", schema);
export {modelSchema as Model};