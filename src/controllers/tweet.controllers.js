import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";


const createTweet = asyncHandler(async (req, res) => {

    const { content } = req.body;
    const owner = req.user?._id;

    if (!content) {
        throw new ApiError(400, "Tweet content is required.");
    }

    if (!owner) {
        throw new ApiError(400, "User must be authenticated to create a tweet.");
    }

    const createdTweet = await Tweet.create({
        content,
        owner,
    });

    if (!createdTweet) {
        throw new ApiError(500, "Failed to create tweet. Please try again.");
    }

    res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {

    const {userId}=req.params;
    if(!userId){
        throw new ApiError(400,"user must required for getUserTweets")
    }

    const user=await User.findById(userId)

    if(!user){
        throw new ApiError(400,"user did not found while getUserTweets")
    }

    const alltweet=await Tweet.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"alltweetarehere"
            }
        },
        {
            $unwind: "$alltweetarehere",
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
            },
        },
    ]);

    if (!alltweet || alltweet.length === 0) {
        throw new ApiError(404, "No tweets found for the specified user.");
    }

    res.status(200).json(new ApiResponse(200, alltweet, "Successfully retrieved all tweets."));
});

const updateTweet = asyncHandler(async (req, res) => {

    const {tweetId}=req.params
    const {content}=req.body

    if(!tweetId || !content){
        throw new ApiError(400,"we did not get content while update the tweet")
    }

    const findtweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content 
        },
        {
            new:true
        }
    )
    if (!findtweet) {
        throw new ApiError(404, "Tweet not found or failed to update.");
    }

    res.status(200).json(new ApiResponse(200, findtweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} =req.params
    if(!tweetId){
        throw new ApiError(400,"tweetid did not get while deleteTweet")
    }

    const deletet=await Tweet.findByIdAndDelete(tweetId)

    if(!deletet){
        throw new ApiError(400,"tweet did not delete ")
    }
    res.status(200).json(new ApiResponse(200,deletet,"delete tweet successfully"))
})



export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}