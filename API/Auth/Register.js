import generateToken from "./GenerateToken.js";
import { hash } from "bcryptjs";
import User from "../../Models/Base.js";

export default async function registerUser(req, res) {
  try {
    const {email, password} = req.body;

    const existing = await User.findOne({ $or: [{ email }] });
    if (existing) return res.status(400).json({ message: "Email already in use." });

    const hashed = await hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      role: 'user'
    });
    await user.save();

    return res.status(201).json({ message: "User registered successfully.",token: generateToken(user) });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

