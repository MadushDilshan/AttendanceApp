import 'package:freezed_annotation/freezed_annotation.dart';

part 'attendance_record.freezed.dart';
part 'attendance_record.g.dart';

@freezed
class AttendanceRecord with _$AttendanceRecord {
  const factory AttendanceRecord({
    required String id,
    required String date,
    required String status,
    String? checkInAt,
    String? checkOutAt,
    int? regularMinutes,
    int? overtimeMinutes,
    int? regularPay,
    int? overtimePay,
    int? totalPayable,
  }) = _AttendanceRecord;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      _$AttendanceRecordFromJson(json);
}
