export const checkAuthorization = (req,res) => {
    if(!req.user){
        return res.status(401).json({message:"Unauthorized Access"});
    }
}
