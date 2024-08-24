import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Like } from "../models/like.models.js"
import { Video } from "../models/vedio.models.js"
import { ApiError } from "../utils/ApiError.js"
import {Tweet} from "../models/tweet.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Comment } from "../models/comment.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const userid=req.user?._id

    const checkvideo=await Video.findById(videoId)
    
    if(!checkvideo){
        throw new ApiError(400,"video did not found while toggleVideoLike")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedby: userid
    });

    if (existingLike) {
        await existingLike.remove();

        return res.status(200).json(
            new ApiResponse(200, {}, "Video unliked successfully")
        );
    } else {
        const newLike = await Like.create({
            video: videoId,
            likedby: userid
        });

        return res.status(200).json(
            new ApiResponse(200, newLike, "Video liked successfully")
        );
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {

    const { commentId } = req.params; 
    const userId = req.user?._id; 

    const checkComment = await Comment.findById(commentId);
    
    if (!checkComment) {
        throw new ApiError(400, "Comment not found while toggleCommentLike");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedby: userId
    });

    if (existingLike) {
        await existingLike.remove();

        return res.status(200).json(
            new ApiResponse(200, {}, "Comment unliked successfully")
        );
    } else {
        const newLike = await Like.create({
            comment: commentId,
            likedby: userId
        });

        return res.status(200).json(
            new ApiResponse(200, newLike, "Comment liked successfully")
        );
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {

    const { tweetId } = req.params; 
    const userId = req.user?._id; 

    const checkTweet = await Tweet.findById(tweetId);
    
    if (!checkTweet) {
        throw new ApiError(400, "Tweet not found");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedby: userId
    });

    if (existingLike) {
        await existingLike.remove();

        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        );
    } else {
        const newLike = await Like.create({
            tweet: tweetId,
            likedby: userId
        });

        return res.status(200).json(
            new ApiResponse(200, newLike, "Tweet liked successfully")
        );
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"can not get user id for getliked videos")
    }
    
    const user=await Like.aggregate([
        {
            $match:{
                likedby:userId,
                video:{$exists:true}
            }
        },{
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"allLikedVideos"
            }
        },
        {
            $unwind: "$allLikedVideos" 
        },
        {
            $project:{
                allLikedVideos:1,
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200, user, "Liked videos fetched successfully")
    );
})



export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}