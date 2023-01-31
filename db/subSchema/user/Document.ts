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
  documentType: {
    type: Schema.Types.String,
    enum: ['CPF', 'RG', 'passport'],
    required: true,
  },
  documentNumber: {
    type: Schema.Types.String,
    required: true,
    unique: true,
  }
}, schema_options);

export {schema};
