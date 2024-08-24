import mongoose, {isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { cloudinaryfileuploader } from "../utils/cloudinary.js";
import { Video } from "../models/vedio.models.js";

const getAllVideos=asyncHandler(async(req,res)=>{
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Build the aggregation pipeline
    const matchStage = {
        $match: {
            isPublished: true, // Only get published videos
            ...(query && { title: { $regex: query, $options: "i" } }), // Search by title
            ...(userId && { owner: mongoose.Types.ObjectId(userId) }) // Filter by owner if userId is provided
        }
    };

    const sortStage = {
        $sort: {
            [sortBy]: sortType === "desc" ? -1 : 1
        }
    };

    const aggregationPipeline = [matchStage, sortStage];

    // Apply pagination
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos"
        }
    };

    const result = await Video.aggregatePaginate(Video.aggregate(aggregationPipeline), options);

    if (!result.videos || result.videos.length === 0) {
        throw new ApiError(404, "No videos found.");
    }

    res.status(200).json(new ApiResponse(200, result, "Videos retrieved successfully."));
});

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body
    const owner=req.user?._id

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required.");
    }


    const videolocalpath=await req.file?.videoFile?.[0]?.path
    const thumbnaillocalpath= await req.file?.thumbnail?.[0]?.path

    if(!videolocalpath || !thumbnaillocalpath){
        throw new ApiError(400,"problem in video path while publishAVideo")
    }


    const videouploader= await cloudinaryfileuploader(videolocalpath)
    const thumbnailuploader= await cloudinaryfileuploader(thumbnaillocalpath)

    if(!videouploader || !thumbnailuploader){
        throw new ApiError(400,"problem in video upload on cloudinary while publishAVideo")
    }

    const uploadvideo=await Video.create({
        videoFile:videouploader.url,
        thumbnail:thumbnailuploader.url,
        title,
        description,
        owner

    })

    if(!uploadvideo){
        throw new ApiError(400,"video did not upload while publishAVideo")
    }

    res.status(200)
    .json(new ApiResponse(200,uploadvideo,"video created successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,"videoid did not get for getVideoById")
    }

    const findvideo=await Video.findById(videoId)

    if(!findvideo){
        throw new ApiError(400,"find video did not get for getVideoById")
    }

    res.status(200)
    .json(new ApiResponse(200,findvideo,"video get successfully"))


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, thumbnail } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required to update the video.");
    }

    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (thumbnail) updateFields.thumbnail = thumbnail;

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new: true,
            runValidators: true 
        }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found or update failed.");
    }

    res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully."));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Video ID is required to delete the video.");
    }
    const deletevid=await Video.findByIdAndDelete(videoId)

    if(!deletevid){
        throw new ApiError(400,"video did not deleted")
    }
    res.status(200)
    .json(new ApiResponse(200,deletevid,"video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required to toggle publish status.");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(new ApiResponse(200, video, "Video publish status toggled successfully."));
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}