// controllers/dashboard.js
import Base from "../../Models/Base.js";
import { User } from "../../Models/User.js";
import { Creator } from "../../Models/Creator.js";

export async function getDashboardData(req, res) {
  try {
    const userId = req.user.id;

    // Step 1: First get the base user to check role (discriminator key)
    const baseUser = await Base.findById(userId).lean();
    if (!baseUser) {
      return res.status(404).json({ message: "User not found." });
    }

    let detailedUser;

    // Step 2: Use the role to query the appropriate discriminator
    switch (baseUser.role) {
      case "user":
        detailedUser = await User.findById(userId)
          .select("username profile_pic bio role")
          .lean();
        break;

      case "creator":
        detailedUser = await Creator.findById(userId)
          .select("username profile_pic bio role")
          .lean();
        break;

      default:
        return res.status(400).json({ message: "Unknown user role." });
    }

    if (!detailedUser) {
      return res.status(404).json({ message: "Full user data not found." });
    }

    // Step 3: Return data
    return res.status(200).json(detailedUser);

  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export const updateDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
  
    // 1. Start with body fields
    const updateData = { ...req.body };
  
    // 2. If a file is uploaded, save filename or full path
    if (req.file) {
      updateData.profile_pic = `http://${req.get("host")}/uploads/${req.file.filename}`; // or full path if needed
    }
  
    console.log("Update data →", updateData);

    updateData.role = "user"
  
    const updatedUser = await Base.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true, overwriteDiscriminatorKey: true }
    );

    updatedUser.save();
  
    return res.json({ success: true, user: updatedUser.role });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Update failed" });
  }
}

export const upgradeToCreator = async (req,res) => {
  try {
    const userId = req.user.id;

    const upgradeData = {...req.body};
    upgradeData.role = 'creator';

    const creator = await Base.findByIdAndUpdate(
      userId,
      {$set: upgradeData},
      {new: true, runValidators: true, overwriteDiscriminatorKey: true}
    )


  }catch(err){
    console.error(err);
  }
}