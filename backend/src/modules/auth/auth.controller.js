import { registerUser } from "./auth.service.js";

export const register = async (req, res) => {
    try {

        const user = await registerUser(req.body);

        res.status(201).json({
            success: true,
            data: user,
});

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};