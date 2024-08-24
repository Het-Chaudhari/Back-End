import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/vedio.models.js";
import { User } from "../models/user.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
   
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Error at getVideoComments->videoId")
    }

    const video=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"allComment"
            }
        },
        {
            $unwind: "$allComment"
        },
        {
            $project:{
                content:1,
                createdAt: 1,
                
            }
        },
        {
            $sort:{createdAt:-1}
        },
        {
            $skip:(page-1)*limit
        },
        {
            $limit:parseInt(limit)
        }
    ]);


    res.status(200)
    .json(new ApiResponse(200,video[0].allComment,"all comments found successfully"))

})

const addComment = asyncHandler(async (req, res) => {
   
    const {videoId} = req.params
    const {content}=req.body;

    if (!content || !videoId) {
        throw new ApiError(400, "Content and video ID are required.");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found at addComment");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id, 
    });

    res.status(201).json(
        new ApiResponse(201, newComment, "Comment added successfully")
    );

})

const updateComment = asyncHandler(async (req, res) => {
    
    const { commentId } = req.params;  
    const { content } = req.body;      

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required at updateComment");  
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id }, 
        { $set: { content } },                   
        { new: true, runValidators: true }     
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found while updated the comments");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params; 

    const deletedComment = await Comment.findOneAndDelete(
        { _id: commentId, owner: req.user._id }  
    );

    if (!deletedComment) {
        throw new ApiError(404, "Comment not found while delete command");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
    );
})
//hi my name is het

export {getVideoComments,addComment,updateComment,deleteComment};