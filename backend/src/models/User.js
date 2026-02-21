const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
