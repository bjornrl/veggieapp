const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//Season in an array because it can ave multiple
const MonthSchema = new Schema({
  name: { type: String, required: true },
  old_english: { type: String, maxLength: 200 },
});

MonthSchema.virtual("url").get(function () {
  return "/" + this._id;
});

module.exports = mongoose.model("Month", MonthSchema);
