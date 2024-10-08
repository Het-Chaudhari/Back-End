
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";



export const verifyJWT =asyncHandler(async (req,res,next)=>{
    try {
        const token=req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token){
            throw new ApiError(400,"token was not get")
        }


        const verifytoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        if(!verifytoken){
            throw new ApiError(400,"token was not match")
        }

        const user=await User.findById(verifytoken?._id).select("-password -refreshToken")

        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
        
        req.user=user
        next()



    } catch (error) {
        throw new ApiError(401,  "Invalid access token")
    }
})

