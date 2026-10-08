import User from "../user/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (userData) => {
    const existingUser = await User.findOne({
    email: userData.email,
});

    if (existingUser) {
    throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await User.create({
        ...userData,
        password: hashedPassword,
    });
    user.password = undefined; // Exclude password from the response

    return user;
};

export const loginUser = async (userData) => {
    const user = await User.findOne({
        email: userData.email,
    }).select("+password");

    if (!user) {
        throw new Error("Invalid email or password");
    }
    
    const isPasswordValid = await bcrypt.compare(
        userData.password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }
    user.password = undefined; // Exclude password from the response
    
    const token = jwt.sign(
  {
    id: user._id,
    role: user.role,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }
);

user.password = undefined;

return {
  user,
  token,
};
};