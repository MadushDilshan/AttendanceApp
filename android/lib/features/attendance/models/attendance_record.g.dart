// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_record.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AttendanceRecordImpl _$$AttendanceRecordImplFromJson(
        Map<String, dynamic> json) =>
    _$AttendanceRecordImpl(
      id: json['id'] as String,
      date: json['date'] as String,
      status: json['status'] as String,
      checkInAt: json['checkInAt'] as String?,
      checkOutAt: json['checkOutAt'] as String?,
      regularMinutes: (json['regularMinutes'] as num?)?.toInt(),
      overtimeMinutes: (json['overtimeMinutes'] as num?)?.toInt(),
      regularPay: (json['regularPay'] as num?)?.toInt(),
      overtimePay: (json['overtimePay'] as num?)?.toInt(),
      totalPayable: (json['totalPayable'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$AttendanceRecordImplToJson(
        _$AttendanceRecordImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'date': instance.date,
      'status': instance.status,
      'checkInAt': instance.checkInAt,
      'checkOutAt': instance.checkOutAt,
      'regularMinutes': instance.regularMinutes,
      'overtimeMinutes': instance.overtimeMinutes,
      'regularPay': instance.regularPay,
      'overtimePay': instance.overtimePay,
      'totalPayable': instance.totalPayable,
    };
