import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';

import '../models/attendance_record.dart';
import '../repositories/attendance_repository.dart';
import '../../offline_queue/models/offline_event.dart';
import '../../offline_queue/providers/sync_provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../geofence/providers/geofence_provider.dart';

const _uuid = Uuid();

// Today's attendance record
final todayRecordProvider = FutureProvider<AttendanceRecord?>((ref) {
  return ref.watch(attendanceRepositoryProvider).getTodayRecord();
});

// State for check-in/out operations
class AttendanceActionState {
  const AttendanceActionState({
    this.isLoading = false,
    this.error,
    this.successMessage,
  });
  final bool isLoading;
  final String? error;
  final String? successMessage;
}

class AttendanceActionNotifier
    extends AutoDisposeNotifier<AttendanceActionState> {
  @override
  AttendanceActionState build() => const AttendanceActionState();

  Future<bool> performCheckIn({
    required String qrToken,
    required Position position,
  }) async {
    state = const AttendanceActionState(isLoading: true);

    // Geofence check
    final workplace = ref.read(workplaceProvider).valueOrNull;
    if (workplace != null) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        workplace.lat,
        workplace.lng,
      );
      if (distance > workplace.radiusMetres) {
        state = AttendanceActionState(
            error:
                'You are ${distance.toStringAsFixed(0)}m from the workplace. Must be within ${workplace.radiusMetres.toStringAsFixed(0)}m.');
        return false;
      }
    }

    try {
      final repo = ref.read(attendanceRepositoryProvider);
      await repo.checkIn(
          qrToken: qrToken, lat: position.latitude, lng: position.longitude);
      state = const AttendanceActionState(successMessage: 'Checked in successfully!');
      ref.invalidate(todayRecordProvider);
      return true;
    } catch (e) {
      // Check if it's a network error (offline) or a validation error
      final errorMsg = e.toString().toLowerCase();
      final isNetworkError = errorMsg.contains('socket') ||
                             errorMsg.contains('network') ||
                             errorMsg.contains('connection') ||
                             errorMsg.contains('timeout');

      if (isNetworkError) {
        // Queue for offline sync only if it's a network issue
        final event = OfflineEvent(
          localId: _uuid.v4(),
          type: 'checkin',
          timestamp: DateTime.now().toUtc().toIso8601String(),
          qrToken: qrToken,
          lat: position.latitude,
          lng: position.longitude,
        );
        await ref.read(syncServiceProvider).enqueue(event);
        state = const AttendanceActionState(
            successMessage: 'Check-in saved offline. Will sync when online.');
        return true;
      } else {
        // Show the actual error (invalid QR, already checked in, etc.)
        state = AttendanceActionState(error: e.toString());
        return false;
      }
    }
  }

  Future<bool> performCheckOut({
    required String qrToken,
    required Position position,
  }) async {
    state = const AttendanceActionState(isLoading: true);
    try {
      final repo = ref.read(attendanceRepositoryProvider);
      await repo.checkOut(
          qrToken: qrToken, lat: position.latitude, lng: position.longitude);
      state = const AttendanceActionState(successMessage: 'Checked out successfully!');
      ref.invalidate(todayRecordProvider);
      return true;
    } catch (e) {
      // Check if it's a network error or validation error
      final errorMsg = e.toString().toLowerCase();
      final isNetworkError = errorMsg.contains('socket') ||
                             errorMsg.contains('network') ||
                             errorMsg.contains('connection') ||
                             errorMsg.contains('timeout');

      if (isNetworkError) {
        // Queue for offline sync only if network issue
        final event = OfflineEvent(
          localId: _uuid.v4(),
          type: 'checkout',
          timestamp: DateTime.now().toUtc().toIso8601String(),
          qrToken: qrToken,
          lat: position.latitude,
          lng: position.longitude,
        );
        await ref.read(syncServiceProvider).enqueue(event);
        state = const AttendanceActionState(
            successMessage: 'Check-out saved offline. Will sync when online.');
        return true;
      } else {
        // Show the actual error
        state = AttendanceActionState(error: e.toString());
        return false;
      }
    }
  }
}

final attendanceActionProvider = AutoDisposeNotifierProvider<
    AttendanceActionNotifier, AttendanceActionState>(
  AttendanceActionNotifier.new,
);
