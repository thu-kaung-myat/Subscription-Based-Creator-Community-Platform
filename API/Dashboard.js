const User = require("../Models/User");

exports.getDashboardData = async(req, res) => {
    try {
      const user = await User.findById(req.user.id).select("username pic_url role");
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      res.status(200).json({
        username: user.username,
        pic_url: user.pic_url,
        role: user.role
      });
  
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }