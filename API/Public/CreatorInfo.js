import { Creator } from "../../Models/Creator.js";

export const getRandomCreator = async (req,res) => {
    try{
        const creators = await Creator.aggregate([
            {
                $match: {role: 'creator'}
            },
            {
                $sample: {size: 3}
            },
            {
                $project: {
                    _id : 0,
                    username : 1,
                    bio : 1,
                    fee : 1,
                    profile_pic : 1
                }
            }
        ])

        res.status(200).json(creators)
    }catch(e){
        console.error(e)
        res.status(404).json({message: "Creators Not Found"})
    }    
}

export const getAllCreators = async (req,res) => {
    try{
        const creators = await Creator.find()
        res.status(200).json(creators)
    }catch(e){
        console.error(e)
        res.status(404).json({message: "Creators Not Found"})
    }
}
