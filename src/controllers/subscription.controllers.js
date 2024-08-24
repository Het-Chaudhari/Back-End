import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";


const toggleSubscription = asyncHandler(async (req, res) => {

    const { channelId } = req.params;
    const user = req.user?._id;

    if (!user || !channelId) {
        throw new ApiError(400, "User or channel ID not found");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: user,
    });

    if (existingSubscription) {
        await Subscription.deleteOne({
            channel: channelId,
            subscriber: user,
        });

        return res.status(200).json(new ApiResponse(200, {}, "Subscription removed successfully"));
    } else {
        const newSubscription = await Subscription.create({
            subscriber: user,
            channel: channelId,
        });

        return res.status(201).json(new ApiResponse(201, newSubscription, "Subscription added successfully"));
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    const {channelId} = req.params
    
    if(!channelId){
        throw new ApiError(400,"channeid did not get while getUserChannelSubscribers")
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const isvalidid=await User.findById(channelId);
    if(!isvalidid){
        throw new ApiError(400,"channel id did not valid ")
    }
    const allSubscriber= await Subscription.aggregate([
        {
            $match:{
                channel:mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"allSub"
            }
        },
        {
            $unwind: "$allSub",
        },
        {
            $project:{
                //username:1
                username: "$allSub.username"
            }
        }
    ])

    res.status(200)
    .json(new ApiResponse(200,allSubscriber,"we got all subscribers for channel"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    
    const { subscriberId } = req.params;

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID not provided");
    }
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    const isValidId = await User.findById(subscriberId);
    if (!isValidId) {
        throw new ApiError(400, "Subscriber ID is not valid");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels"
            }
        },
        {
            $unwind: "$channels",
        },
        {
            $project: {
                channelName: "$channels.username" 
            }
        }
    ]);

    res.status(200).json(new ApiResponse(200, subscribedChannels, "Successfully retrieved subscribed channels"));
});


export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}