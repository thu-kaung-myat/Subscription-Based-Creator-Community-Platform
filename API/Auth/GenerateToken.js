import pkg from "jsonwebtoken";
const {sign} = pkg;

export default function genToken({_id, role}) {return sign(
      { id: _id, role: role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}