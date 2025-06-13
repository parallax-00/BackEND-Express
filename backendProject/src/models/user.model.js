import mongoose from "mongoose";
import { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { use } from "react";
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String, //* Cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, //* Cloudinary URL
    },
    watchHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    password: {
      type: String,
      required: [true, " Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  } else {
    this.password = bcrypt.hash(this.password, 10);
    next();
  }
}); //! Now the password stored in MONGODB will be encrypted but to match the password with user password during login it must be decrypted or handled in such a way that it returns true when the DB password and the user password exactly matches.Therefore mongoose allows methods that can be added to provide this functionality.

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare("password", this.password);
}; //* Here isPasswordCorrect is the added method to the Schema.---More methods are added for JWT accessibility.---

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
