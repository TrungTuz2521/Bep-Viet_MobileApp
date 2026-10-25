const { getDefaultConfig } = require("expo/metro-config");

// Đã bỏ withNativeWind (NativeWind không được dùng trong dự án)
const config = getDefaultConfig(__dirname);

module.exports = config;
