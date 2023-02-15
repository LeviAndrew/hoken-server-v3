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
  //implementar a jogada para ser salva no banco de dados.
  schema = new Schema({
    estoqueInicial: {
      type: Schema.Types.Number,
    },
    recebimentoMercadori: {
      type: Schema.Types.Number,
    },
    estoqueDisponivel: {
      type: Schema.Types.Number,
    },
    recebimentoPedido: {
      type: Schema.Types.Number,
    },
    entregaMercadoria: {
      type: Schema.Types.Number,
    },
    pendencia: {
      type: Schema.Types.Number,
    },
    estoqueFinal: {
      type: Schema.Types.Number,
    },
    rentStockUsage: {
      type: Schema.Types.Number,
    },
    custo: {
      type: Schema.Types.Number,
    },
    custoTotal: {
      type: Schema.Types.Number,
    },
    deliveryType: {
      type: Schema.Types.String,
    },
    decisao: {
      type: Schema.Types.Number,
    },
  }, schema_options);

export {schema};
