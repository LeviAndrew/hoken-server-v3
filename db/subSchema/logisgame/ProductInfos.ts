import {Schema} from "mongoose";

const schema_options = {
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
    name: {
      type: Schema.Types.String,
      trim: true,
      required: [true, 'name.required'],
    },
    varegistaPrice: {
      type: Schema.Types.Number,
      required: [true, 'varegistaPrice.required'],
    },
    atacadistaPrice: {
      type: Schema.Types.Number,
      required: [true, 'atacadistaPrice.required'],
    },
    fabricantePrice: {
      type: Schema.Types.Number,
      required: [true, 'fabricantePrice.required'],
    },
    productsPerBox: {
      type: Schema.Types.Number,
      required: [true, 'productsPerBox.required'],
    },
    boxesPerPallet: {
      type: Schema.Types.Number,
      required: [true, 'boxesPerPallet.required']
    }
  }, schema_options);

export {schema};
