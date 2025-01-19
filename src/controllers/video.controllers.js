import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.models.js';
import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose, { isValidObjectId } from 'mongoose';
import { uploadOnCloudinary, deleteFromCloudinary, deleteFromCloudinaryUsingUrl } from '../utils/cloudinary.js';

const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

        const videos = await Video.aggregate([
            {
                $match: {
                    isPulished: false,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    owner: {
                        $arrayElemAt: ["$owner", 0],
                    },
                },
            },
            {
                $sort: {
                    // [sortBy]: sortType,
                    createdAt: -1,
                },
            },
            {
                $skip: (parseInt(page) - 1) * parseInt(limit),
            },
            {
                $limit: parseInt(limit),
            },
        ]);

        return res
            .status(200)
            .json(new ApiResponse(200, videos, "videos found successfully"));
    } catch (error) {
        console.log("Error in getAllVideos: ", error);
        throw new ApiError(500, 'Internal Server Error: failed to fetch videos');
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body

        //get video, upload to cloudinary, create video
        const videoPath = req.files?.video[0]?.path;
        const thumbnailPath = req.files?.thumbnail[0]?.path;

        if (!videoPath) {
            throw new ApiError(400, "Please provide video");
        }
        if (!thumbnailPath) {
            throw new ApiError(400, "Please provide thumbnail");
        }
        let video = "", thumbnail = "";

        try {
            video = await uploadOnCloudinary(videoPath);
            thumbnail = await uploadOnCloudinary(thumbnailPath);
        } catch (error) {
            console.log("Error uploading to cloudinary: ", error);
        }

        const uploadedVideo = await Video.create({
            title,
            description,
            videoFile: video.secure_url,
            duration: video.duration,
            thumbnail: thumbnail.secure_url,
            owner: req.user._id,
            isPublished: false,
        })

        return res.status(201).json(new ApiResponse(201, uploadedVideo, "Video uploaded successfully"));
    } catch (error) {
        if (video) await deleteFromCloudinary(video.public_id);
        if (thumbnail) await deleteFromCloudinary(thumbnail.public_id);
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(201).json(new ApiResponse(200, video, "Video found successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "You are not authorized to update this video");
    }

    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Please provide title and description");
    }
    const thumbnailPath = req.file?.path;

    if (thumbnailPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailPath);
        video.thumbnail = thumbnail.secure_url;
    }

    video.title = title;
    video.description = description;
    const savedVideo = await video.save({ new: true });

    if (!savedVideo) {
        if (thumbnailPath) await deleteFromCloudinary(thumbnail.public_id);
        throw new ApiError(500, "Failed to update video");
    }

    return res.status(200).josn(new ApiResponse(200, savedVideo, "Video updated successfully"));
})

// todo later
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Please provide video id")
    }
    const userId = req.user._id;
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video?.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "You are not authorized to delete this video")
    }

    const videoUrl = video?.videoFile;
    const thumbnailUrl = video?.thumbnail;
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if (!deletedVideo) {
        throw new ApiError(500, "Failed to delete video")
    }

    try {
        if (videoUrl) await deleteFromCloudinaryUsingUrl(videoUrl)
        if (thumbnailUrl) await deleteFromCloudinaryUsingUrl(thumbnailUrl);
    } catch (error) {
        throw new ApiError(500, "Failed to delete video and thumbnail from cloudinary")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "You are not authorized to update this video")
    }
    video.isPublished = !video.isPublished;
    const savedVideo = await video.save({ new: true })
    if (!savedVideo) {
        throw new ApiError(500, "Failed to update video")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, savedVideo, "Video updated successfully"))
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo, 
    deleteVideo, 
    togglePublishStatus
}