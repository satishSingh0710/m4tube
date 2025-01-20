import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    const like = await Like.findOne({ video: videoId, likeBy: req.user?._id });

    if (like) {
        const removedLike = await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, removedLike, "Like removed"));
    } else {
        const newLike = new Like({ video: videoId, likeBy: req.user._id })
        const savedLike = await newLike.save()
        return res
            .status(201)
            .json(new ApiResponse(201, savedLike, "Like added"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }

    const like = await Like.findOne({ comment: commentId, likeBy: req.user?._id });

    if (like) {
        const removedLike = await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, removedLike, "Like removed"));
    } else {
        const newLike = new Like({ comment: commentId, likeBy: req.user._id })
        const savedLike = await newLike.save()
        return res
            .status(201)
            .json(new ApiResponse(201, savedLike, "Like added"));
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required")
    }

    const like = await Like.findOne({ tweet: tweetId, likeBy: req.user?._id });

    if (like) {
        const removedLike = await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, removedLike, "Like removed"));
    } else {
        const newLike = new Like({ tweet: tweetId, likeBy: req.user._id });
        const savedLike = await newLike.save();
        return res
            .status(201)
            .json(new ApiResponse(201, savedLike, "Like added"));
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likeBy: req.user._id,
            },
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "video",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            duration: 1,
                            title: 1,
                            views: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$video",
            },
        },
        {
            $unset: "likeBy",
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideo, "Liked videos found successfully"));


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}