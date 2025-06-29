const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  dob: {
    type: String,
    required: [false],
  },
  gender: {
    type: String,
    required: [false],
    enum: ["male", "female"],
  },
  cid: {
    type: String,
    required: [false],
    unique: true,
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "sme", "pharmacist", "admin"],
    default: "user",
  },
  connectedWallet: {
    type: String,
    required: true,
  },
  ownedProperties: [Number],
  isVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    // password won't be included when we get the users
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },

  // Second Step Details
  gewog: {
    type: String,
    required: [false],
  },
  village: {
    type: String,
    required: [false],
  },
  dzongkhag: {
    type: String,
    required: [false],
  },
  thram_number: {
    type: String,
    required: [false],
  },
  house_number: {
    type: String,
    required: [false],
  },
  // End of second step details

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (
    update.password !== "" &&
    update.password !== undefined &&
    update.password == update.passwordConfirm
  ) {
    // Hash the pasword with cost of 12
    this.getUpdate().password = await bcrypt.hash(update.password, 12);

    // Delete passwordConfirm field
    update.passwordConfirm = undefined;
    next();
  } else next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
