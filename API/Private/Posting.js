import Post from "../../Models/Post.js";
import PostLike from "../../Models/PostLike.js";
import Subscription from "../../Models/Subscription.js";
import { deleteImage } from "../Util/CloudinaryUpload.js";
import { checkAuthorization } from "./Authorization.js";

export const createPost = async (req,res) => {
    checkAuthorization(req,res);
    const user = req.user.id;
    const post = {...req.body};
    post.author = user;
    if (Array.isArray(req.files)) {
        const attachments = req.attachments;
        console.log(attachments)
        post.attachments = attachments;
    }
    if(req.user.role=="creator"){
        try{
            const newPost = new Post(post);
            await newPost.save();
            return res.status(201).json({message: "Post created successfully", post: newPost});
        }catch(error){
            return res.status(501).json({message: error});
        } 
    }else{
        post.attachments.map(pic=>deleteImage(pic.publicId));
        return res.status(401).json({message:"Unauthorized access"});
    }
};

export const getAllPosts = async(req,res)=>{
    checkAuthorization(req,res);
    const user = req.user.id;
    let creator;

    if(req.params.creatorId){
        creator = req.params.creatorId;
    }
    if(!creator){    //show a creator his own posts on dashboard
        try{
            const posts = await Post.find({author : user});
            return res.status(200).json(posts);
        }catch(error){
            return res.status(404).json({message: error});
        }
    }else if(creator && isSubscribed(user,creator)){     //show a creator's post to his active subscriber on creator's profile
        try{
            console.log("subscribed");
            const posts = await Post.find({author : creator});
            return res.status(200).json(posts);
        }catch(error){
            return res.status(404).json({message: error});
        }
    }else{
        return res.status(401).json({message: "Unauthorized Access"});
    }
};

const isSubscribed = async(user,creator) => {
    const subscription = await Subscription.findOne({
        subscriberId : user,
        creatorId : creator,
        active : true
    });
    if(subscription){
        console.log("subscribed")
        return true;
    }else{
        console.log("not subscribed")
        return false;
    }
}

export const editPost = async (req,res) => {
    checkAuthorization(req,res);
    const user = req.user.id;
    const role = req.user.role;
    const postId = req.params.postId;
    const editData = {...req.body};
    if (Array.isArray(req.files)) {
        const attachments = req.attachments;
        console.log(attachments)
        editData.attachments = attachments;
    }
    try{
        const post = await Post.findById(postId).select('author attachments');
        if(role=="creator" && post.author==user){
            const editedPost = await Post.findByIdAndUpdate(postId,{$set:editData});
            await editedPost.save();
            post.attachments.map(pic=>deleteImage(pic.publicId));
            return res.status(200).json({message: "Post edited successfully", post: editedPost});
        }else{
            return res.status(401).json({message:"Unauthorized access"});
        }   
    }catch(error){
        console.log("Update error");
        editData.attachments.map(pic=>deleteImage(pic.publicId));
        return res.status(500).json({message: error});
    } 
};

export const deletePost = async (req,res) => {
    checkAuthorization(req,res);
    const user = req.user.id;
    const role = req.user.role;
    const postId = req.params.postId;
    try{
        const post = await Post.findById(postId).select('author attachments');
        if(role=="creator" && post.author==user){
            await Post.findByIdAndDelete(postId);
            post.attachments.map(pic=>{deleteImage(pic.publicId)});
            return res.status(200).json({message: "Successfully deleted ", post});
        }else{
            return res.status(401).json({message:"Unauthorized access"});
        }    
    }catch(error){
        console.log("Delete error");
        return res.status(500).json({message: error});
    } 
};

export const likePost = async (req, res) => {
    checkAuthorization(req, res);
    const user = req.user.id;
    const postId = req.params.postId; 
    try{
        const post = await Post.findById(postId).select('likes author');
        if(isSubscribed(user, post.author)){
            const like = new PostLike({
                postId,
                subscriberId : user
            })
            await like.save();
            return res.status(204);
        }else{
            return res.status(401).json({message:"Unauthorized access"});
        }     
    }catch(error){
        return res.status(500).json({message : error});
    } 
};