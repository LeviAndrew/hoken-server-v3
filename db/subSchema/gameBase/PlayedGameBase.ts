import {Schema} from "mongoose";

const
  schema_options = {
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
    played: {
      type: Schema.Types.Mixed,
    },
  }, schema_options);

export {schema};
