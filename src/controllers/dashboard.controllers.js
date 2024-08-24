import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.models.js"
import { Video } from "../models/vedio.models.js"
import { Like } from "../models/like.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required to get stats.");
    }

    // Get total videos and total views
    const videoStats = await Video.aggregate([
        { $match: { owner: mongoose.Types.ObjectId(channelId) } },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    // Get total subscribers
    const subscriberStats = await Subscription.aggregate([
        { $match: { channel: mongoose.Types.ObjectId(channelId) } },
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 }
            }
        }
    ]);

    // Get total likes across all videos in the channel
    const likeStats = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        { $unwind: "$videoData" },
        {
            $match: { "videoData.owner": mongoose.Types.ObjectId(channelId) }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ]);

    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers: subscriberStats[0]?.totalSubscribers || 0,
        totalLikes: likeStats[0]?.totalLikes || 0,
    };

    res.status(200).json(new ApiResponse(200, stats, "Channel stats retrieved successfully."));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required to get videos.");
    }

    const videos = await Video.find({ owner: channelId });

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel.");
    }

    res.status(200)
    .json(new ApiResponse(200, videos, "Channel videos retrieved successfully."));
});


export {
    getChannelStats,
    getChannelVideos
}
