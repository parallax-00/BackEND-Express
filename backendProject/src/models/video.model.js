import mongoose from "mongoose";
import { Schema } from "mongoose";
import mongooseAggregratePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //* Cloudinary URL
      required: true,
    },
    thumbnail: {
      type: String, //* Cloudinary URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //* Cloudinary URL
      required: true,
    },
    views: {
      type: Number,
      required: true,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
videoSchema.plugin(mongooseAggregratePaginate)
export const Video = mongoose.model("Videos", videoSchema);
