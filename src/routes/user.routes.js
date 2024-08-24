import { Router } from "express";
import {

    changeCurrentPassword,
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginuser, 
    logoutuser, 
    refreshAccessToken, 
    registeruser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage

} from "../controllers/user.controllers.js"

import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(upload
    .fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),registeruser);

router.route("/login").post(loginuser); 

router.route("/logout").post(verifyJWT,logoutuser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").get(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/covert-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)



export default router;
