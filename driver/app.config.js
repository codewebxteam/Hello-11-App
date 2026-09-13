const { withAndroidManifest } = require('@expo/config-plugins');

const withRazorpayManifestFix = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const app = androidManifest.application[0];

    if (app.activity) {
      app.activity = app.activity.map((activity) => {
        if (activity.$['android:name'] === 'com.razorpay.DeeplinkActivity') {
          if (activity['intent-filter']) {
            activity['intent-filter'] = activity['intent-filter'].map((filter) => {
              if (filter.data) {
                // Remove the https scheme to prevent Play Console domain verification errors
                filter.data = filter.data.filter((dataNode) => {
                  const scheme = dataNode.$['android:scheme'];
                  if (scheme === 'https' || scheme === 'http') {
                    return false;
                  }
                  return true;
                });
              }
              return filter;
            });
          }
        }
        return activity;
      });
    }
    return config;
  });
};

module.exports = ({ config }) => {
  const mapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    config.android?.config?.googleMaps?.apiKey ||
    "AIzaSyChfzWHWK0Gk8oNeqK2_6HoxOpBf78YTJ8";

  config = withRazorpayManifestFix(config);

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          apiKey: mapsApiKey,
        },
      },
    },
  };
};
