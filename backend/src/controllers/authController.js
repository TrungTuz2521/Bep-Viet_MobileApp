const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { user, recipe, saved_recipe, user_allergy, user_favorite_category, user_activity_history, sequelize } = require("../models");
const { invalidateUserCache } = require("../middlewares/authMiddleware");

// JWT Secret from env or default
// Không có giá trị dự phòng: server.js đã chặn khởi động khi thiếu JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existingUser = await user.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await user.create({
            email,
            password_hash,
            name,
            role: "user",
            status: "active"
        });

        // Don't send password hash back
        const userWithoutPassword = newUser.toJSON();
        delete userWithoutPassword.password_hash;

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const foundUser = await user.findOne({ where: { email } });
        if (!foundUser) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, foundUser.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        if (foundUser.deleted_at) {
            return res.status(403).json({ success: false, message: "Tài khoản đã bị xóa hoặc vô hiệu hóa." });
        }

        if (foundUser.status === "suspended") {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa." });
        }


        const token = jwt.sign(
            { id: foundUser.id, role: foundUser.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const userData = foundUser.toJSON();
        delete userData.password_hash;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: userData
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // req.user is set by authMiddleware
        const userData = req.user.toJSON();
        delete userData.password_hash;

        return res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar_url } = req.body;
        
        await req.user.update({
            name: name || req.user.name,
            avatar_url: avatar_url || req.user.avatar_url
        });

        const userData = req.user.toJSON();
        delete userData.password_hash;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: userData
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Old and new password required" });
        }

        const isMatch = await bcrypt.compare(oldPassword, req.user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect old password" });
        }

        const new_password_hash = await bcrypt.hash(newPassword, 10);
        await req.user.update({ password_hash: new_password_hash });
        invalidateUserCache(req.user.id);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required to delete account" });
        }

        const isMatch = await bcrypt.compare(password, req.user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        // Soft delete user (paranoid model)
        await req.user.destroy();
        invalidateUserCache(req.user.id);
        
        // Also soft delete user's recipes
        await recipe.destroy({ where: { owner_user_id: req.user.id } });

        // Cleanup orphan data liên quan
        await saved_recipe.destroy({ where: { user_id: req.user.id } });
        await user_allergy.destroy({ where: { user_id: req.user.id } });
        await sequelize.query('DELETE FROM user_allergy_group WHERE user_id = :userId', { replacements: { userId: req.user.id } });
        await user_favorite_category.destroy({ where: { user_id: req.user.id } });
        await user_activity_history.destroy({ where: { user_id: req.user.id } });

        return res.status(200).json({
            success: true,
            message: "Account and associated data deleted successfully (30-day retention)"
        });
    } catch (error) {
        console.error("Delete Account Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
