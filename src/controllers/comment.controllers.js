import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const pipeline = [
        {
            $match: {
                video: videoId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $project: {
                comment: 1,
                createdAt: 1,
                updatedAt: 1,
                "owner._id": 1,
                "owner.fullname": 1,
                "owner.email": 1,
            },
        },
    ];

    const options = {
        page: parseInt(page, 10), // Current page number
        limit: parseInt(limit, 10), // Number of comments per page
    };

    const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    if (!result) throw new ApiError(404, "No comments found");

    res.status(200).json(new ApiResponse(200, result, "Comments found successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { comment } = req.body;
    const user = req.user._id;

    if (!comment) throw new ApiError(400, "Comment is required");
    if (!videoId) throw new ApiError(400, "Video ID is required");
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const newComment = new Comment({
        video: videoId,
        comment,
        owner: user
    });
    const savedComment = await newComment.save();
    return res.status(201).json(new ApiResponse(201, savedComment, "Comment added"));
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { newComment } = req.body;
    if (!newComment) throw new ApiError(400, "Comment is required");

    const comment = await Comment.findById(commentId);
    if (comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to update this comment");
    comment.comment = newComment;
    const updatedComment = await comment.save();
    if (!updatedComment) throw new ApiError(500, "Failed to update comment");
    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id, // Ensure the user owns the comment
    });
    if (!deletedComment) throw new ApiError(404, "Comment not found");
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}