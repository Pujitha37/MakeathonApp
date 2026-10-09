const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withLocalPiNetwork(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const application = configWithManifest.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Unable to configure Android local-network access: application manifest is missing.');
    }
    application.$['android:usesCleartextTraffic'] = 'true';
    return configWithManifest;
  });
};
