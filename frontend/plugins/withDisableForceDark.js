// Config plugin: tắt "Force Dark" của Android cho AppTheme.
// Một số ROM (Xiaomi MIUI/HyperOS, Oppo ColorOS...) tự đảo màu app khi bật chế độ tối hệ thống,
// làm nền sáng bị xám, màu cam bị đổi tông. App đã tự xử lý dark mode nên không cần hệ thống can thiệp.
// Lưu ý: chỉ có hiệu lực sau khi prebuild + build lại dev client (Expo Go không áp dụng).
const { withAndroidStyles, AndroidConfig } = require('expo/config-plugins');

module.exports = function withDisableForceDark(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults.resources.style || [];
    const appTheme = styles.find((s) => s.$ && s.$.name === 'AppTheme');

    // Theme "Light" cố định không đổi theo chế độ tối → khớp với userInterfaceStyle "automatic"
    // bằng DayNight (mặc định của Expo SDK 53+), để Alert / nền cửa sổ native theo đúng giao diện app.
    if (appTheme && typeof appTheme.$.parent === 'string' && appTheme.$.parent.startsWith('Theme.AppCompat.Light')) {
      appTheme.$.parent = appTheme.$.parent.replace('Theme.AppCompat.Light', 'Theme.AppCompat.DayNight');
    }

    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:forceDarkAllowed',
      value: 'false',
      // Thuộc tính có từ Android 10 (API 29)
      targetApi: '29',
    });
    return cfg;
  });
};
