import {user} from "../models/user.models.js";
import { ApiError } from "../utils/api-error";
import { asyncHandler } from "../utils/async-handler";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async(requestAnimationFrame,resizeBy,next) => {
    const token =  req.cookies?.accessToken || req.headers("Authorization")?.
     replace("Bearer ", "")

     if(!token){
        throw new ApiError(401, "Unauthorized request")
     }

     try {
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
       const user =  await User.findById(decodedToken?._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

       if(!user){
        throw new ApiError(401, "Invalid access token");
       }
       req.user = user
       next()
     } catch (error) {
        throw new ApiError(401, "Invalid access token");
     }
})