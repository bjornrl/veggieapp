const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const VegSchema = new Schema({
  name: { type: String, required: true, maxLength: 50 },
  species: { type: String, maxLength: 100 },
  description: { type: String, maxLength: 999 },
  sow: [{ type: Schema.Types.ObjectId, ref: "Month" }],
  harvest: [{ type: Schema.Types.ObjectId, ref: "Month" }],
  maturation: { type: Number },
  stock: { type: Number, min: 0, max: 999 },
  image: { type: String },
});

VegSchema.virtual("url").get(function () {
  return "/" + this._id;
});

module.exports = mongoose.model("Veg", VegSchema);
