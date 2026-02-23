import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  emailVerificationmailgenContent,
  sendEmail,
} from "../utils/mail.js";

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

export { registerUser };
