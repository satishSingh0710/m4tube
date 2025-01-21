import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const userId = req.user._id;
    const tweet = await Tweet.create({ content, owner: userId })
    if (!tweet) throw new ApiError(400, "Tweet not created")
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user._id;
    const tweets = await Tweet
        .aggregate([
            {
                $match: {
                    owner: userId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                unwind: "$owner"
            },
            {
                project: {
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "owner._id": 1,
                    "owner.fullname": 1,
                    "owner.email": 1
                }
            }
        ])
    if (!tweets) throw new ApiError(404, "No tweets found")
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets found successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    const userId = req.user._id;
    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: userId },
        { content },
        { new: true }
    );
    if (!tweet) throw new ApiError(404, "Tweet not found");
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;


    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
        new ApiResponse(200, deletedTweet, "Tweet deleted successfully")
    );
});
export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}