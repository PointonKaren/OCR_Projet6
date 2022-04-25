const mongoose = require("mongoose");
const sanitizerPlugin = require("mongoose-sanitizer-plugin");

const sauceSchema = mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  manufacturer: { type: String, required: true },
  description: { type: String, required: true },
  mainPepper: { type: String, required: true },
  imageUrl: { type: String, required: true },
  heat: { type: Number, required: true },
  likes: { type: Number, required: true },
  dislikes: { type: Number, required: true },
  usersLiked: { type: ["String <userId>"], required: true },
  usersDisliked: { type: ["String <userId>"], required: true },
});

sauceSchema.plugin(sanitizerPlugin, {
  mode: "sanitize",
  include: ["name", "manufacturer", "description", "mainPepper"],
});

module.exports = mongoose.model("Sauce", sauceSchema);
