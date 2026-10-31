/* global module, __dirname */
module.exports = async () => {
  const { getDefaultConfig } = await import("expo/metro-config");
  return getDefaultConfig(__dirname);
};
