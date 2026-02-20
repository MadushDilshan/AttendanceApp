import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_client.dart';
import '../models/attendance_record.dart';

class AttendanceRepository {
  AttendanceRepository(this._dio);
  final Dio _dio;

  Future<AttendanceRecord> checkIn({
    required String qrToken,
    required double lat,
    required double lng,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/attendance/checkin',
      data: {
        'qrToken': qrToken,
        'deviceTimestamp': DateTime.now().toUtc().toIso8601String(),
        'location': {'lat': lat, 'lng': lng},
      },
    );
    return _parseRecord(res.data!['record'] as Map<String, dynamic>);
  }

  Future<AttendanceRecord> checkOut({
    required String qrToken,
    required double lat,
    required double lng,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/attendance/checkout',
      data: {
        'qrToken': qrToken,
        'deviceTimestamp': DateTime.now().toUtc().toIso8601String(),
        'location': {'lat': lat, 'lng': lng},
      },
    );
    return _parseRecord(res.data!['record'] as Map<String, dynamic>);
  }

  Future<AttendanceRecord?> getTodayRecord() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/attendance/today');
      final data = res.data!;
      if (data['record'] == null) return null;
      return _parseRecord(data['record'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  AttendanceRecord _parseRecord(Map<String, dynamic> json) {
    return AttendanceRecord.fromJson(
        json.map((k, v) => MapEntry(k == '_id' ? 'id' : k, v)));
  }
}

final attendanceRepositoryProvider = Provider<AttendanceRepository>(
  (ref) => AttendanceRepository(ref.watch(dioClientProvider)),
);
