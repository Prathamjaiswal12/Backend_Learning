import mongoose, { Schema } from "mongoose";
import {AvailableUserRole, UserRolesEnum} from "../utils/constants.js";


const projectMembeschema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    Project: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: AvailableUserRole,
        default: UserRolesEnum.MEMBER
    }
}, {timestamps: true})


export const ProjectMember  = mongoose.model(
    "ProjectMember",
    "projectMembeschema",
);