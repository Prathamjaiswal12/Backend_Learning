import { User } from "../models/user.models.js";
import {Project} from "../models/project.models.js";
import {ProjectMember} from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";


const getProjects = asyncHandler(async (req,res) => {
   const projects =  await ProjectMember.aggregate(
   [
    {
        $match: {
            user: new mongoose.Types.ObjectId(req.user._id),

        },
    },
    {
        $lookup: {
            from: "projects",
            localField: "projects",
            foreignField: "_id",
            as: "projects",
            pipeline: [
                {
                    $lookup: {
                        from: "projectmembers",
                        localField: "_id",
                        foreignField: "projects",
                        as: "projectmembers"
                    },
                },
                {
                    $addFields: {
                        members: {
                            $size: "$projectmembers",
                        },
                    },
                },
            ],
        },
    },
    {
        $unwind: "$project"
    },
    {
        $project: {
            project: {
                _id: 1,
                name: 1,
                description: 1,
                members: 1,
                createdAt: 1,
                createdBy: 1
            },
            role: 1,
            _id: 0
        }
    },
]);
   return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});


const getProjectById = asyncHandler(async (req,res) => {
    //test

});

const createProjects = asyncHandler(async (req,res) => {
    //test

});

const updateProjects = asyncHandler(async (req,res) => {
    const {name, description} = req.body
    const {projectId} = req.params

   const project =  await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description
        },
         {new: true}
    )

    if(!project){
        throw new ApiError(404, "Project not found")
    }

    return res
     .status(200)
     .json(
        new ApiResponse(
            200,
            project,
            "Project updated successfully"
        )
     )

});

const deleteProjects = asyncHandler(async (req,res) => {
    const {projectId} = req.params

    const project = await Project.findByIdAndDelete(projectId)
    if(!project){
        throw new ApiError(404, "Project not found");
    }

    return res
     .status(200)
     .json(new ApiResponse(
        200,
        project,
    "Project deleted successfully"))


});

const addMembersToProjects = asyncHandler(async (req,res) => {
    //test

});

const getProjectsMembers = asyncHandler(async (req,res) => {
    //test

});

const updateMemberRole = asyncHandler(async (req,res) => {
    //test

});

const deleteMember = asyncHandler(async (req,res) => {
    //test

});


export {
    addMembersToProjects,
    createProjects,
    deleteMember,
    deleteProjects,
    getProjects,
    getProjectById,
    getProjectsMembers,
    updateMemberRole,
    updateProjects
};