/// Base URL for the backend API.
/// Override this with a build flavor or --dart-define for production.
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://172.20.10.2:3000/api', // Mobile hotspot IP
);

const Duration kConnectTimeout = Duration(seconds: 60);
const Duration kReceiveTimeout = Duration(seconds: 60);

// Geofencing
const double kDefaultGeofenceRadiusMetres = 100.0;

// Pay constants (mirrors backend)
const int kRegularStartHour = 8;
const int kRegularEndHour = 17;
