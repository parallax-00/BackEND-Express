import { ApiErrors } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
//* A seperate method to generate Access and Refresh Tokens ->
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "Something went wrong while generating the Refresh and Access Tokens"
    );
  }
};

//* An endpoint where User can request to refresh it's Access Token ->
const refreshAccessToken = asyncHandler(async (req, res) => {
  //? First get the refreshToken of the user from the database by making a query using Cookies
  //? Decode the token using JWT and match it with the secret refreshToken
  //? If matches then generate new tokens and plug them in

  //* Getting the refreshToken from the user
  const userRefreshToken = req.cookie?.refreshToken || req.body.refreshToken;
  if (!userRefreshToken) {
    throw new ApiErrors(401, "Unauthorized Request");
  }

  //* Verifying the userRefreshToken with the SecretRefreshToken stored in env.
  try {
    const decodedToken = jwt.verify(
      userRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiErrors(400, "Invalid Refresh Token");
    }

    if (userRefreshToken !== user?.refreshToken) {
      throw new ApiErrors(401, "Refresh Token is expired or used");
    }

    //* Now the verifications have been completed, new tokens are to be generated and passed
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { newAccessToken, newRefreshToken } = generateAccessAndRefreshTokens(
      user._id
    );
    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", newAccessToken, options)
      .json(
        new ApiResponse(
          200,
          { newAccessToken, newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid refresh token");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  //? Get user detail from frontend
  //? Validation - not empty
  //? Check if user already exists: username, email
  //? Check for images, check for avatar. If available then upload them to Cloudinary, avatar (required param) check.
  //? Create user Object - create entry in db (Creates user)
  //? Remove password and refresh token field from response
  //? Check whether the user was created successfully or not
  //? Return result

  const { fullName, username, email, password } = req.body; //.. .body is coming from expressJS
  //* Validation can be done per parameter using the if statements -
  // if (fullName === "") {
  //   throw new ApiErrors(400, "Full name is required");
  // }
  // if (username === "") {
  //   throw new ApiErrors(400, "username is required");
  // }
  // if (email === "") {
  //   throw new ApiErrors(400, "email is required");
  // }
  // if (password === "") {
  //   throw new ApiErrors(400, "password is required");
  // }

  //* Another approach for Validation -
  if ([fullName, email, password, username].some((e) => e?.trim() === "")) {
    throw new ApiErrors(400, "All fields are required. ");
  }
  //* Checking if user already exists -
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiErrors(409, "User already Exists.");
  }
  //* Files and avatar -.... .files is coming from multer
  //? req.files is an array with objects being Avatar and CoverImage and their properties in key value pairs respectively in each object
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar file is required");
  }
  //*uploading them to Cloudinary

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiErrors(400, "Avatar is Required");
  }
  //*Create User Object and make it an entrant to database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //*Checking whether the user was created successfully or not -
  const createdUserId = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUserId) {
    throw new ApiErrors(500, "Something went wrong while registering the user");
  }
  return res //! Final step of returing the USER
    .status(200)
    .json(new ApiResponse(200, createdUserId, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //? to login a user get info from req.body -> username, password, email
  //? find the user
  //? if found check password
  //? if checked and matches then generate both refresh and access tokens
  //? send tokens to user using cookies, dont send password to user
  //? Complete Login

  //* Getting Data from req.body
  const { username, password, email } = req.body;

  if (!(username || email)) {
    throw new ApiErrors(400, "Either email or username is required to login");
  }

  //*Finding the user which will be in database if signedup
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  //* Check for password
  const passwordCheck = await user.isPasswordCorrect(password);
  if (!passwordCheck) {
    throw new ApiErrors(400, "Password is invalid");
  }

  //* Generate the Tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //* Send the generated Tokens as cookies and send response as User logged in Successfully
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        {
          message: "User Logged in Successfully ",
        }
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //? To logout a user just clear the cookies and reset the refreshToken
  //? Made A Middleware which will make a query on the basis of the refresh token and return the new 'user' object as used below and then refreshToken is set to undefined as the object no longer has the refreshToken, after the accessToken Exipry it will be logged out
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });
  //? Now clearing the cookies and accessToken to log out the user finally
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        {
          message: "User Logged Out Successfully",
        }
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //?Get the user, already loggedIn(can be verified by the middleware of verifyJWT) going to change its password
  //?Take user's oldPassword match it with the password stored in DB for extra security
  //?Take in new password (optional -> make an input for the confirmPassword)
  //?Set the newPassword by updating the DB
  //*Fields extracted from the body
  const { oldPassword, newPassword } = req.body;

  //*Finding the User
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiErrors(401, "Access not authorized");
  }

  //*Matching the Password with already made method isPasswordCorrect in the user.model.js
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiErrors(400, "Invalid Password");
  }

  //*Matches then take in newPassword and set it as new password in the user object
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  //*Sending the response and notifying the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //*To get the current user we know it has to be logged in, if its logged in then we are sure it went through the middelware auth.middleware.js which then returns us the verified (logged in) user object.
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  //?Fields which we want to give functionlaity of updating
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiErrors(400, "All fields are required");
  }
  //*Fetching the user and setting up the new details
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      //?Using mongoDB operator setting in the fields
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Details are updated successfully"));
});

//?Can be updated only by the logged in user
//?Multer middleware will be used for accessibility to flies handling -> While writing the routes.
//! Add a functionality of deleting old Avatar image and CoverImage if uploaded new one.
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar file is missing");
  }
  //*Uploads on Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiErrors(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Uploaded Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new ApiErrors(400, "CoverImage file is missing");
  }
  //*Uploads on Cloudinary
  const CoverImage = await uploadOnCloudinary(CoverImageLocalPath);
  if (!CoverImage.url) {
    throw new ApiErrors(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { CoverImage: CoverImage.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Uploaded Successfully"));
});

//! Getting the Channel
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiErrors(400, "No username found");
  }
  //* Implementing Aggregation Pipeline ->
  const channel = await User.aggregate([
    {
      //* First pipeline to match
      $match: { username: username?.toLowerCase() },
    },
    {
      //* Lookup pipeline to perform left outer join, uses Schema Subscription -> MongoDB(subscriptions)
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      //* Adds fields to the Document fo the Subscibers to the 'channel' and the Channels 'channel' subscribedTo
      $addFields: {
        subscribersCount: { $size: "$subsribers" },
        SubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          //* Sends the flag by performing the query 'if', to check whether the Channel is subscribed already or not to implement the 'Subscribe' <-> 'Subscribed' functionality
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //*Project Pipeline is used to selectively pass the field value to be shown by putting in '1' to show and '0' to not
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        SubscribedToCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel) {
    throw new ApiErrors(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "$videos",
        localField: "$watchHistory",
        foreignField: "_id",
        as: " watchHistory ",
        pipeline: [
          {
            $lookup: {
              from: "$users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfuly"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
