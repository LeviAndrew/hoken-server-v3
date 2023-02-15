import {Schema} from "mongoose";
import {schema as ProductInfo} from "./ProductInfos";

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
    async: {
      type: Schema.Types.Boolean,
      default: false,
      required: [true, 'async.required'],
    },
    timer: {
      type: Schema.Types.Boolean,
      default: true,
      required: [true, 'timer.required'],
    },
    time: {
      type: Schema.Types.Number,
      default: 45,
      min: 10,
    },
    playersPerTeam: {
      type: Schema.Types.Number,
      default: 3,
    },
    isDefault: {
      type: Schema.Types.Boolean,
      default: false,
      required: [true, 'isDefault.required'],
    },
    weekAmount: {
      type: Schema.Types.Number,
      default: 50,
      required: [true, 'weeks.required'],
    },
    demands: {
      type: [
        {
          type: Schema.Types.Number,
        }
      ],
      required: [true, 'demands.required'],
    },
    productInfos: {
      type: ProductInfo,
      required: [true, 'productInfo.required'],
    },
    defaultDeliverCost: {
      type: Schema.Types.Number,
      required: [true, 'twoTurnsDeliverCost.required'],
    },
    varegistaOwnStockAvailable: {
      type: Schema.Types.Number,
      required: [true, 'varegistaOwnStock.required'],
    },
    atacadistaOwnStockAvailable: {
      type: Schema.Types.Number,
      required: [true, 'atacadistaOwnStock.required'],
    },
    fabricanteOwnStockAvailable: {
      type: Schema.Types.Number,
      required: [true, 'fabricanteOwnStock.required'],
    },
    rentStockCostByPallet: {
      type: Schema.Types.Number,
      required: [true, 'rentStock.required'],
    },
    varegistaPenaltyForUndeliveredProduct: {
      type: Schema.Types.Number,
      required: [true, 'varegistaPenaltyForUndeliveredProduct.required'],
    },
    atacadistaPenaltyForUndeliveredProduct: {
      type: Schema.Types.Number,
      required: [true, 'varegistaPenaltyForUndeliveredProduct.required'],
    },
    fabricantePenaltyForUndeliveredProduct: {
      type: Schema.Types.Number,
      required: [true, 'varegistaPenaltyForUndeliveredProduct.required'],
    },
    atacadistaMultiplicador: {
      type: Schema.Types.Number,
      required: [true, "atacadistaMultiplicador.required"],
    },
    fabricanteMultiplicador: {
      type: Schema.Types.Number,
      required: [true, "fabricanteMultiplicador.required"],
    },
  }, schema_options);

export {schema};
