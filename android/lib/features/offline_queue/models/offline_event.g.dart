// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offline_event.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OfflineEventAdapter extends TypeAdapter<OfflineEvent> {
  @override
  final int typeId = 0;

  @override
  OfflineEvent read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OfflineEvent(
      localId: fields[0] as String,
      type: fields[1] as String,
      timestamp: fields[2] as String,
      qrToken: fields[3] as String,
      lat: fields[4] as double,
      lng: fields[5] as double,
      retryCount: fields[6] as int,
    );
  }

  @override
  void write(BinaryWriter writer, OfflineEvent obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.localId)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.timestamp)
      ..writeByte(3)
      ..write(obj.qrToken)
      ..writeByte(4)
      ..write(obj.lat)
      ..writeByte(5)
      ..write(obj.lng)
      ..writeByte(6)
      ..write(obj.retryCount);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OfflineEventAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
