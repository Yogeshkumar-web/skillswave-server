import mongoose from "mongoose";

export interface DecodedToken {
  _id: mongoose.Types.ObjectId;
  iat?: number;
  exp?: number;
}
