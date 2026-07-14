import User from "../user/user.model.js";
import bcrypt from "bcrypt";

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