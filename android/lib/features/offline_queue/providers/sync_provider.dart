import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';
import '../models/offline_event.dart';

/// Watches connectivity and auto-flushes the offline queue when online.
final syncServiceProvider = Provider<SyncService>((ref) {
  final svc = SyncService(ref.watch(dioClientProvider));
  svc.init();
  return svc;
});

class SyncService {
  SyncService(this._dio);
  final Dio _dio;

  void init() {
    Connectivity().onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      if (online) {
        _flush();
      }
    });
  }

  Box<OfflineEvent> get _box => Hive.box<OfflineEvent>('offline_queue');

  Future<void> enqueue(OfflineEvent event) async {
    await _box.put(event.localId, event);
    // Try immediate sync
    final connectivity = await Connectivity().checkConnectivity();
    final online = connectivity.any((r) => r != ConnectivityResult.none);
    if (online) _flush();
  }

  Future<void> _flush() async {
    final events = _box.values.toList();
    if (events.isEmpty) return;

    final payload = events.map((e) => {
      'localId': e.localId,
      'type': e.type,
      'timestamp': e.timestamp,
      'qrToken': e.qrToken,
      'lat': e.lat,
      'lng': e.lng,
    }).toList();

    try {
      await _dio.post<void>('/attendance/sync', data: {'events': payload});
      // Remove all successfully synced events
      for (final e in events) {
        await e.delete();
      }
    } catch (_) {
      // Will retry on next connectivity change
    }
  }

  int get pendingCount => _box.length;
}
