// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attendance_record.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AttendanceRecord _$AttendanceRecordFromJson(Map<String, dynamic> json) {
  return _AttendanceRecord.fromJson(json);
}

/// @nodoc
mixin _$AttendanceRecord {
  String get id => throw _privateConstructorUsedError;
  String get date => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get checkInAt => throw _privateConstructorUsedError;
  String? get checkOutAt => throw _privateConstructorUsedError;
  int? get regularMinutes => throw _privateConstructorUsedError;
  int? get overtimeMinutes => throw _privateConstructorUsedError;
  int? get regularPay => throw _privateConstructorUsedError;
  int? get overtimePay => throw _privateConstructorUsedError;
  int? get totalPayable => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AttendanceRecordCopyWith<AttendanceRecord> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceRecordCopyWith<$Res> {
  factory $AttendanceRecordCopyWith(
          AttendanceRecord value, $Res Function(AttendanceRecord) then) =
      _$AttendanceRecordCopyWithImpl<$Res, AttendanceRecord>;
  @useResult
  $Res call(
      {String id,
      String date,
      String status,
      String? checkInAt,
      String? checkOutAt,
      int? regularMinutes,
      int? overtimeMinutes,
      int? regularPay,
      int? overtimePay,
      int? totalPayable});
}

/// @nodoc
class _$AttendanceRecordCopyWithImpl<$Res, $Val extends AttendanceRecord>
    implements $AttendanceRecordCopyWith<$Res> {
  _$AttendanceRecordCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? date = null,
    Object? status = null,
    Object? checkInAt = freezed,
    Object? checkOutAt = freezed,
    Object? regularMinutes = freezed,
    Object? overtimeMinutes = freezed,
    Object? regularPay = freezed,
    Object? overtimePay = freezed,
    Object? totalPayable = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      checkInAt: freezed == checkInAt
          ? _value.checkInAt
          : checkInAt // ignore: cast_nullable_to_non_nullable
              as String?,
      checkOutAt: freezed == checkOutAt
          ? _value.checkOutAt
          : checkOutAt // ignore: cast_nullable_to_non_nullable
              as String?,
      regularMinutes: freezed == regularMinutes
          ? _value.regularMinutes
          : regularMinutes // ignore: cast_nullable_to_non_nullable
              as int?,
      overtimeMinutes: freezed == overtimeMinutes
          ? _value.overtimeMinutes
          : overtimeMinutes // ignore: cast_nullable_to_non_nullable
              as int?,
      regularPay: freezed == regularPay
          ? _value.regularPay
          : regularPay // ignore: cast_nullable_to_non_nullable
              as int?,
      overtimePay: freezed == overtimePay
          ? _value.overtimePay
          : overtimePay // ignore: cast_nullable_to_non_nullable
              as int?,
      totalPayable: freezed == totalPayable
          ? _value.totalPayable
          : totalPayable // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceRecordImplCopyWith<$Res>
    implements $AttendanceRecordCopyWith<$Res> {
  factory _$$AttendanceRecordImplCopyWith(_$AttendanceRecordImpl value,
          $Res Function(_$AttendanceRecordImpl) then) =
      __$$AttendanceRecordImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String date,
      String status,
      String? checkInAt,
      String? checkOutAt,
      int? regularMinutes,
      int? overtimeMinutes,
      int? regularPay,
      int? overtimePay,
      int? totalPayable});
}

/// @nodoc
class __$$AttendanceRecordImplCopyWithImpl<$Res>
    extends _$AttendanceRecordCopyWithImpl<$Res, _$AttendanceRecordImpl>
    implements _$$AttendanceRecordImplCopyWith<$Res> {
  __$$AttendanceRecordImplCopyWithImpl(_$AttendanceRecordImpl _value,
      $Res Function(_$AttendanceRecordImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? date = null,
    Object? status = null,
    Object? checkInAt = freezed,
    Object? checkOutAt = freezed,
    Object? regularMinutes = freezed,
    Object? overtimeMinutes = freezed,
    Object? regularPay = freezed,
    Object? overtimePay = freezed,
    Object? totalPayable = freezed,
  }) {
    return _then(_$AttendanceRecordImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      checkInAt: freezed == checkInAt
          ? _value.checkInAt
          : checkInAt // ignore: cast_nullable_to_non_nullable
              as String?,
      checkOutAt: freezed == checkOutAt
          ? _value.checkOutAt
          : checkOutAt // ignore: cast_nullable_to_non_nullable
              as String?,
      regularMinutes: freezed == regularMinutes
          ? _value.regularMinutes
          : regularMinutes // ignore: cast_nullable_to_non_nullable
              as int?,
      overtimeMinutes: freezed == overtimeMinutes
          ? _value.overtimeMinutes
          : overtimeMinutes // ignore: cast_nullable_to_non_nullable
              as int?,
      regularPay: freezed == regularPay
          ? _value.regularPay
          : regularPay // ignore: cast_nullable_to_non_nullable
              as int?,
      overtimePay: freezed == overtimePay
          ? _value.overtimePay
          : overtimePay // ignore: cast_nullable_to_non_nullable
              as int?,
      totalPayable: freezed == totalPayable
          ? _value.totalPayable
          : totalPayable // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AttendanceRecordImpl implements _AttendanceRecord {
  const _$AttendanceRecordImpl(
      {required this.id,
      required this.date,
      required this.status,
      this.checkInAt,
      this.checkOutAt,
      this.regularMinutes,
      this.overtimeMinutes,
      this.regularPay,
      this.overtimePay,
      this.totalPayable});

  factory _$AttendanceRecordImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceRecordImplFromJson(json);

  @override
  final String id;
  @override
  final String date;
  @override
  final String status;
  @override
  final String? checkInAt;
  @override
  final String? checkOutAt;
  @override
  final int? regularMinutes;
  @override
  final int? overtimeMinutes;
  @override
  final int? regularPay;
  @override
  final int? overtimePay;
  @override
  final int? totalPayable;

  @override
  String toString() {
    return 'AttendanceRecord(id: $id, date: $date, status: $status, checkInAt: $checkInAt, checkOutAt: $checkOutAt, regularMinutes: $regularMinutes, overtimeMinutes: $overtimeMinutes, regularPay: $regularPay, overtimePay: $overtimePay, totalPayable: $totalPayable)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceRecordImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.checkInAt, checkInAt) ||
                other.checkInAt == checkInAt) &&
            (identical(other.checkOutAt, checkOutAt) ||
                other.checkOutAt == checkOutAt) &&
            (identical(other.regularMinutes, regularMinutes) ||
                other.regularMinutes == regularMinutes) &&
            (identical(other.overtimeMinutes, overtimeMinutes) ||
                other.overtimeMinutes == overtimeMinutes) &&
            (identical(other.regularPay, regularPay) ||
                other.regularPay == regularPay) &&
            (identical(other.overtimePay, overtimePay) ||
                other.overtimePay == overtimePay) &&
            (identical(other.totalPayable, totalPayable) ||
                other.totalPayable == totalPayable));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      date,
      status,
      checkInAt,
      checkOutAt,
      regularMinutes,
      overtimeMinutes,
      regularPay,
      overtimePay,
      totalPayable);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceRecordImplCopyWith<_$AttendanceRecordImpl> get copyWith =>
      __$$AttendanceRecordImplCopyWithImpl<_$AttendanceRecordImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceRecordImplToJson(
      this,
    );
  }
}

abstract class _AttendanceRecord implements AttendanceRecord {
  const factory _AttendanceRecord(
      {required final String id,
      required final String date,
      required final String status,
      final String? checkInAt,
      final String? checkOutAt,
      final int? regularMinutes,
      final int? overtimeMinutes,
      final int? regularPay,
      final int? overtimePay,
      final int? totalPayable}) = _$AttendanceRecordImpl;

  factory _AttendanceRecord.fromJson(Map<String, dynamic> json) =
      _$AttendanceRecordImpl.fromJson;

  @override
  String get id;
  @override
  String get date;
  @override
  String get status;
  @override
  String? get checkInAt;
  @override
  String? get checkOutAt;
  @override
  int? get regularMinutes;
  @override
  int? get overtimeMinutes;
  @override
  int? get regularPay;
  @override
  int? get overtimePay;
  @override
  int? get totalPayable;
  @override
  @JsonKey(ignore: true)
  _$$AttendanceRecordImplCopyWith<_$AttendanceRecordImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
