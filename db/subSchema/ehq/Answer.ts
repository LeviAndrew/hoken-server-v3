import {Schema} from "mongoose";

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
  order: {
    type: Schema.Types.Number,
    min: 0,
  },
  text: {
    type: Schema.Types.String,
    required: [true, 'answerTextRequired'],
    trim: true,
  }
  // _id: {
  //   type: Schema.Types.String,
  //   // required: true
  // },
}, schema_options);

export {schema};
