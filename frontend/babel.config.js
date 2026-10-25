module.exports = function (api) {
  api.cache(true);
  return {
    // Đã tắt NativeWind (jsxImportSource "nativewind" + "nativewind/babel"):
    // dự án không dùng className, còn lớp interop của NativeWind làm mất style dạng hàm
    // của Pressable (style={({ pressed }) => ...}) trên điện thoại.
    presets: ["babel-preset-expo"],
  };
};
