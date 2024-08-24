import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { cloudinaryfileuploader } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { upload } from "../middlewares/multer.middlewares.js";

const generateaccessandrefreshtoken=  async(userId)=>{
    
    try {
        const user = await User.findById(userId)
        const accesstoken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accesstoken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registeruser = asyncHandler(async (req, res) => {
    // console.log("hii");
    
    const {fullname,email,username,password}=req.body;
     //console.log("req.body is  ",req.body);

    if([fullname,email,username,password].some((field)=>
        field?.trim()===""
        
    )){
        throw new ApiError(400,"all field are required");
    }

    const existeduser=await User.findOne({
        $or:[{email},{username}]
    })

    if(existeduser){
        throw new ApiError(409,"same user are not allowed");
    }

    const avatarlocalpath = req.files?.avatar[0]?.path;
    
    //const coverImagelocalpath = req.files?.coverImage[0]?.path;
    let coverImagelocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImagelocalpath = req.files?.coverImage[0]?.path;
    }

    if(!avatarlocalpath){
        throw new ApiError(409,"u have to submit avtar");
    }

    const avatar1=await cloudinaryfileuploader(avatarlocalpath);
    const coverImage1=await cloudinaryfileuploader(coverImagelocalpath);

    if(!avatar1){
        throw new ApiError(409,"avatar is not updating on cloudinary ");
    }

    const user1=await User.create({
        fullname,
        avatar:avatar1.url,
        coverImage:coverImage1?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user1._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(409,"some thing went wrong while creating user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"user registred successfully")
    )


});

const loginuser = asyncHandler(async (req,res)=>{

    const {username,email,password}=req.body

    if(!(username || email)){
        throw new ApiError(400 , "username or email one of them is required ")
    }
    if(!password){
        throw new ApiError(400,"password must required")
    }

    const usercheckdata= await User.findOne({
        $or:[{email},{username}]
    })

    if(!usercheckdata){
        throw new ApiError(404,"email or username not found")
    }

    const ispasswordvalid= await usercheckdata.isPasswordCorrect(password)

    if(!ispasswordvalid){
        throw new ApiError(404,"wrong password")
    }

    const {accesstoken,refreshToken}=await generateaccessandrefreshtoken(usercheckdata._id)

    const loggedinuser=await User.findById(usercheckdata._id)
    .select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accesstoken",accesstoken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedinuser,accesstoken,refreshToken
        },"user logged in successfully")
    )

})

const logoutuser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const rtoken=req.cookies.refreshToken || req.body.refreshToken
    if(!rtoken){
        throw new error(401,"token was not generated ");
    }

    try {
        const isrtokenvalid=jwt.verify(rtoken,process.env.REFRESH_TOKEN_SECRET);

        const user=await User.findById(isrtokenvalid?._id);

        if(!user){
            throw new error(401,"user was not found ");
        }

        if(rtoken!==user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accesstoken,newrefreshToken}=generateaccessandrefreshtoken(user._id)

        return res
        .status(200)
        .cookie("accesstoken", accesstoken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accesstoken, refreshToken: newrefreshToken},
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")  
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body

    const user=await User.findById(req.user?._id)

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new error(403,"password was not correct")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))


})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(200,req.user,"current user fetch successfully");
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    
    const {email,fullname}=req.body();
    if(!(fullname && email)){
        throw new ApiError(400,"email and password are wrong")
    }
    const user=User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                email:email,
                fullname:fullname
            }
        },{
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"email and username updated successfully"))
});

const updateUserAvatar= asyncHandler(async(req,res)=>{
    const filepath=req.file?.path

    if(!filepath){
        throw new ApiError(400,"file path is not there while we uploading new image")
    }

    const avatar=await uploadOnCloudinary(filepath)

    if(!avatar.url){
        throw new ApiError(400,"new avatar did not update on clodinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar updated correctly"))

})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }



    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile=asyncHandler (async(req,res)=>{

    const {username} = req.params

    if(!username){
        throw new ApiError(400,"username did not found while getuserchanle")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user =await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField: "watchhistory",
                foreignField:"_id",
                as:"watchhistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    res.status(200)
    .json(new ApiResponse(200,user[0].watchhistory,"Watch history fetched successfully"))
})



export { 
    registeruser,
    loginuser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 };

