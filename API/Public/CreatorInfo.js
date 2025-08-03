import { Creator } from "../../Models/Creator.js";

export const getRandomCreator = async (req,res) => {
    try{
        const creators = await Creator.aggregate([
            {
                $match: {role: 'creator'}
            },
            {
                $sample: {size: 4}
            },
            {
                $project: {
                    username : 1,
                    bio : 1,
                    fee : 1,
                    profilePic : 1,
                    category : 1
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
        const creators = await Creator.find({role : "creator"}).select("username bio fee profilePic category")
        res.status(200).json(creators)
    }catch(e){
        console.error(e)
        res.status(404).json({message: "Creators Not Found"})
    }
}
