import 'package:hive/hive.dart';

part 'offline_event.g.dart';

@HiveType(typeId: 0)
class OfflineEvent extends HiveObject {
  @HiveField(0)
  late String localId; // UUID for deduplication

  @HiveField(1)
  late String type; // 'checkin' | 'checkout'

  @HiveField(2)
  late String timestamp; // ISO 8601 UTC

  @HiveField(3)
  late String qrToken;

  @HiveField(4)
  late double lat;

  @HiveField(5)
  late double lng;

  @HiveField(6)
  late int retryCount;

  OfflineEvent({
    required this.localId,
    required this.type,
    required this.timestamp,
    required this.qrToken,
    required this.lat,
    required this.lng,
    this.retryCount = 0,
  });
}
