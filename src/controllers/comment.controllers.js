import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/vedio.models.js";
import { User } from "../models/user.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    // apda bhegu models che gana badha jema thi apde 
    // query lagai ne je je comments na vedio==given id 
    // ene add karo 
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"we did not find video for get all comments for video")
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

// pass it from auth middle ware
const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    //req.body parthi comment ane vedio ni id avse jene 
    //apde e video ni id che ke naii 
    // e check karine comment ne e vedio ma add kari laishu

    const {videoId} = req.params
    const {content}=req.body;

    if (!content || !videoId) {
        throw new ApiError(400, "Content and video ID are required.");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
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

// pass it from auth middle ware
const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // req.body parthi new and old comment malse
    // ane req.params parathi vedio id 
    // check ke old coment che jo haa to old ==new 

    const { commentId } = req.params;  
    const { content } = req.body;      

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");  
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
    // TODO: delete a comment

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

export {getVideoComments,addComment,updateComment,deleteComment};