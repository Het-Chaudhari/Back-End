import mongoose, {isValidObjectId} from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlist.models.js"
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// pass it through auth middle ware
const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist

    const {name, description} = req.body
    const owner = req.user?._id;

    if(!name || !description ){
        throw new ApiError(400,"did not get name or description while create playlist ")
    }

    if (!owner) {
        throw new ApiError(401, "User not authenticated.");
    }


    const createmate=await Playlist.create({
        name:name,
        description:description,
        owner:owner,
        vedios: []
    })

    if(!createmate){
        throw new ApiError(400,"create new playlist got fail")
    }

    res.status(200)
    .json(new ApiResponse(200,createPlaylist,"playlist ctreated successfully"))

});

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID.");
    }

    const checkUser = await User.findById(userId);
    if (!checkUser) {
        throw new ApiError(404, "User not found.");
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos"
            }
        }
    ]);

    res.status(200).json(new ApiResponse(200, userPlaylists, "User playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id

    const {playlistId} = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID for getplaylist");
    }

    const playlist=await Playlist
    .findById(playlistId)
    .populate("owner","name","description")
    .populate("videos")              
    

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
    
        res.status(200).json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        );
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.videos.includes(videoId)) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Video already exists in the playlist")
        );
    }
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const { playlistId, videoId } = req.params;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(404, "Video not found in the playlist");
    }

    playlist.videos = playlist.videos.filter(video => !video.equals(videoId));

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const { playlistId } = req.params;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true, runValidators: true } 
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found while updating");
    }

    res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}