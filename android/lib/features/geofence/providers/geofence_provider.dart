import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';
import '../../../core/constants/api_constants.dart';

class WorkplaceGeofence {
  const WorkplaceGeofence({
    required this.lat,
    required this.lng,
    required this.radiusMetres,
  });
  final double lat;
  final double lng;
  final double radiusMetres;
}

final workplaceProvider = FutureProvider<WorkplaceGeofence?>((ref) async {
  try {
    final dio = ref.watch(dioClientProvider);
    final res = await dio.get<Map<String, dynamic>>('/workplace/geofence');
    final wp = res.data!['workplace'] as Map<String, dynamic>;
    final coords = (wp['location'] as Map<String, dynamic>)['coordinates'] as List;
    return WorkplaceGeofence(
      lat: (coords[1] as num).toDouble(),
      lng: (coords[0] as num).toDouble(),
      radiusMetres: (wp['geofenceRadiusMetres'] as num?)?.toDouble() ??
          kDefaultGeofenceRadiusMetres,
    );
  } catch (_) {
    return null;
  }
});

/// Current GPS position stream — requests permission if needed.
final currentPositionProvider = StreamProvider<Position?>((ref) async* {
  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    yield null;
    return;
  }

  // Use medium accuracy (WiFi + cell towers) for fast initial fix
  // High accuracy (GPS satellites) is slow; 100m geofence doesn't need it
  try {
    final initial = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.medium,
      timeLimit: const Duration(seconds: 10),
    );
    yield initial;
  } catch (_) {}

  yield* Geolocator.getPositionStream(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.medium,
      distanceFilter: 10,
    ),
  ).map((p) => p);
});

/// Whether the employee is currently within the geofence.
final isInsideGeofenceProvider = Provider<bool>((ref) {
  final position = ref.watch(currentPositionProvider).valueOrNull;
  final workplace = ref.watch(workplaceProvider).valueOrNull;

  if (position == null || workplace == null) return false;

  final distance = Geolocator.distanceBetween(
    position.latitude,
    position.longitude,
    workplace.lat,
    workplace.lng,
  );
  return distance <= workplace.radiusMetres;
});

/// Debug info — remove after fixing location issues.
final geofenceDebugProvider = Provider<String>((ref) {
  final posState = ref.watch(currentPositionProvider);
  final wpState = ref.watch(workplaceProvider);

  final pos = posState.valueOrNull;
  final wp = wpState.valueOrNull;
  final wpError = wpState.error;

  final posStr = pos != null
      ? 'GPS: ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}'
      : posState.isLoading
          ? 'GPS: loading…'
          : 'GPS: null (permission denied?)';

  final wpStr = wp != null
      ? 'WP: ${wp.lat.toStringAsFixed(4)}, ${wp.lng.toStringAsFixed(4)} r=${wp.radiusMetres}m'
      : wpError != null
          ? 'WP error: $wpError'
          : wpState.isLoading
              ? 'WP: loading…'
              : 'WP: null';

  return '$posStr\n$wpStr';
});
