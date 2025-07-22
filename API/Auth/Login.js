import generateToken from "./GenerateToken.js";
import { compare } from "bcryptjs";
import User from "../../Models/Base.js";


export default async function loginUser(req, res) {
    try {
      console.log(req.body);
      
      const { email, password } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
  
      // Check password
      const isMatch = await compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
  
      // Generate JWT token
      const token = generateToken(user)
  
      // Respond with success and user info (omit password!)
      const { password: _, ...userData } = user.toObject(); // remove password
      res.status(200).json({
        message: "Login successful",
        token,
        user: userData
      });
  
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }