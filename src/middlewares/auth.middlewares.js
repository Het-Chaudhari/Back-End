// it will verify ke user che ke naii by using refreshtoken
// and jo che to return user
// jenathi jya apde route ma middele ware tarike 
// call karishu tya tya apde aa user ne pan req.user karine use kari sakishu 

import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";



export const verifyJWT =asyncHandler(async (req,res,next)=>{
    try {
        // cookie thi levana kem ke apde token cookie thi moklya che
        const token=req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token){
            throw new ApiError(400,"token was not get")
        }

        // verify the token

        const verifytoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        if(!verifytoken){
            throw new ApiError(400,"token was not match")
        }

        const user=await User.findById(verifytoken?._id).select("-password -refreshToken")
        // doubt ke verifytoken._id thi id kevi rite mali aam to ganu badhu mali sake like email...

        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
        
        req.user=user
        next()



    } catch (error) {
        throw new ApiError(401,  "Invalid access token")
    }
})

