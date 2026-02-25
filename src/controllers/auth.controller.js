import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  emailVerificationmailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import { generateAccessAndRefereshTokens } from "../utils/token.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const registerUser = asyncHandler(async (req, res) => {
  console.log("Register request:", req.body);

  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // check existing user
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // create user
  const user = await User.create({
    email,
    username,
    password,
    isEmailVerified: false,
  });

  // generate verification token
  const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();


  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  // send email
  await sendEmail({
    email: user.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationmailgenContent(
      user.username,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/verify-email/${unHashedToken}`
    ),
  });

  // remove sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      { user: createdUser },
      "User registered successfully and verification email sent"
    )
  );
});

const login = asyncHandler(async (req, res) => {
  const {email, password, username} = req.body

  if(!username ||  !email){
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({email});

  if(!user){
    throw new ApiError(400, "User doesnot exists.")
  }

  const isPasswordValid = await user.isPasswordCorrect
  (password);

  if(!isPasswordValid){
    throw new ApiError(400, "Invalid credentials");
  }

  const {accessToken , refreshToken} = await 
  generateAccessAndRefereshTokens(user._id)

 const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );
 
  const options = {
    httpOnly: true,
    secure: true,
  }

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
       refreshToken
      },
       "User logged in successfully"
    )
  )
});


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,   // or req.userId depending on verifyJWT
    { $set: { refreshToken: "" } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});


const getcurrentUser = asyncHandler(async (req,res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      req.user,
      "Current User fetched successfully"
    )
  );
});

const verifyEmail = asyncHandler(async (req,res) => {
  const {emailVerificationToken} = req.params

  if(!emailVerificationToken){
    throw new ApiError(400, "Email verification token is missing")
  }

  let hashedToken = crypto
  .createHash("sha256")
  .update(emailVerificationToken)
  .digest("hex")

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: {$gt: Date.now()}
  })

  if(!user){
    throw new ApiError(400, "Token is invalid or expired")
  }


  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true
      },
      "Email is Verified",
    )
  )
  });

const resendEmailVerification = asyncHandler(async (req,res) => {
  const user = await User.findById(req.user?._id);

  if(!user){
    throw new ApiError(404, "User does not exist")
  }
  if(user.isEmailVerified){
    throw new ApiError(409, "Email is already verified")
  }


  const { unHashedToken, hashedToken, tokenExpiry } =
   user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  // send email
  await sendEmail({
    email: user.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationmailgenContent(
      user.username,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/verify-email/${unHashedToken}`
    ),
  });

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Mail has sent to your email ID"
    )
  )

});

const refreshAccessToken = asyncHandler(async (req, res) => {
const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

if(!incomingRefreshToken){
  throw new ApiError(401, "Unauthorized access")
}

try {
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.
    REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id);
  if(!user){
    throw new ApiError(401, "Invalid refresh token");
  }

  if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401, "Refresh token is expired");
  }

  const options = {
    httpOnly: true,
    secure: true
  }

  const {accessToken, refreshToken: newRefreshToken} = await 
  generateAccessAndRefereshTokens(user._id)

  user.refreshToken = newRefreshToken;
  await user.save()


  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newRefreshToken, options)
  .json(
    new ApiResponse(
      200,
      {accessToken, refreshToken: newRefreshToken},
      "Access token refreshed"
    )
  )

} catch (error) {
   throw new ApiError(401, "Invalid Refresh token");
}
})

const forgotPasswordRequest = asyncHandler (async (req,res) =>
{
  const {email} = req.body

  const user = await User.findOne({email})

  if(!user){
    throw new ApiError(404, "User does not exists", [])
  }
  
  const {unHashedToken, hashedToken, tokenExpiry} = 
  user.generateTemporaryToken()

  user.forgotPasswordToken = hashedToken
  user.forgotPasswordExpiry = tokenExpiry

  await user.save({validateBeforeSave: false})

  await sendEmail({
    email: user.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      {},
      "Password reset mail has been sent on your mail ID"
    )
   )
})

const resetForgotPassword = asyncHandler (async (req,res) =>
{
  const {resetToken} = req.params
  const {newPassword} = req.body

  let hashedToken = crypto
   .createHash("sha256")
   .update(resetToken)
   .digest("hex")

   const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: {$gt: Date.now()}
   })

   if(!user){
    throw new ApiError(489, "Token is invalid or expired")
   }

   user.forgotPasswordExpiry = undefined
   user.forgotPasswordToken = undefined

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset successfully"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordValid){
    throw new ApiError(400, "Invalid old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
   .status(200)
   .json(
     new ApiResponse(
      200,
      {},
      "Password Chaged successfully"
     )
   )
})

export {
   registerUser,
   login,
   logoutUser, 
   getcurrentUser,
   verifyEmail, 
   resendEmailVerification,
   refreshAccessToken,
   forgotPasswordRequest,
   resetForgotPassword,
   changeCurrentPassword
  };
