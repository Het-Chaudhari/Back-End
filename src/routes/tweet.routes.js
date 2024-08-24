import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

import {updateTweet,deleteTweet,getUserTweets,createTweet} from "../controllers/tweet.controllers.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router