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
  schema = new Schema({
    async: {
      type: Schema.Types.Boolean,
    },
    timer: {
      type: Schema.Types.Boolean,
    },
    time: {
      type: Schema.Types.Number,
    },
    playersPerTeam: {
      type: Schema.Types.Number,
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
  }, schema_options);

export {schema};
