import { Router } from "express";
import { registerUser, login, logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getcurrentUser, changeCurrentPassword, resendEmailVerification } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userChangeCurrentPasswordValidator, userForgotPasswordValidator, userLoginValidator, userRegisterValidator, userResetForgotPasswordValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/validator.middleware.js";

const router = Router();

//unsecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);
router
 .route("/verify-email/:verificationToken")
 .get(verifyEmail);

router
 .route("/refresh-token")
 .post(refreshAccessToken);

router
 .route("/forgot-password")
 .post(userForgotPasswordValidator(), validate, 
 forgotPasswordRequest);

router
 .route("/reset-password/:resetToken")
 .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);



// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getcurrentUser);
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword);
router.route("/resend-email-verificaion").post(verifyJWT, resendEmailVerification)

export default router;
