import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../auth/providers/auth_provider.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../geofence/providers/geofence_provider.dart' show isInsideGeofenceProvider, workplaceProvider, geofenceDebugProvider;
import '../../offline_queue/providers/sync_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _requestPermissions();
    // Init sync service
    ref.read(syncServiceProvider);
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.location,
      Permission.camera,
    ].request();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider).valueOrNull;
    final todayRecord = ref.watch(todayRecordProvider);
    final isInsideGeofence = ref.watch(isInsideGeofenceProvider);
    final geofenceDebug = ref.watch(geofenceDebugProvider);
    final pendingCount = ref.watch(syncServiceProvider).pendingCount;

    final employeeName = authState?.employee?.name ?? 'Employee';
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, MMMM d, yyyy').format(now);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
        title: const Text('AttendanceApp'),
        actions: [
          if (pendingCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Chip(
                label: Text('$pendingCount offline',
                    style: const TextStyle(fontSize: 11, color: Colors.white)),
                backgroundColor: Colors.orange.shade700,
                padding: EdgeInsets.zero,
              ),
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authStateProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(todayRecordProvider);
          ref.invalidate(workplaceProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Greeting card
            Card(
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hello, $employeeName!',
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(dateStr,
                        style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Location status
            Card(
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(
                      isInsideGeofence ? Icons.location_on : Icons.location_off,
                      color: isInsideGeofence ? Colors.green : Colors.grey,
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isInsideGeofence
                                ? 'You are at the workplace'
                                : 'Not at workplace location',
                            style: TextStyle(
                              color: isInsideGeofence ? Colors.green.shade700 : Colors.grey,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            geofenceDebug,
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Today's record
            todayRecord.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _ErrorCard(message: e.toString()),
              data: (record) => _TodaySummaryCard(record: record),
            ),
            const SizedBox(height: 20),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    label: 'Check In',
                    icon: Icons.login,
                    color: const Color(0xFF16A34A),
                    enabled: isInsideGeofence &&
                        (todayRecord.valueOrNull?.checkInAt == null ||
                            todayRecord.valueOrNull?.status == 'absent'),
                    onTap: () => context.push('/scanner', extra: {'mode': 'checkin'}),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionButton(
                    label: 'Check Out',
                    icon: Icons.logout,
                    color: const Color(0xFF2563EB),
                    enabled: isInsideGeofence &&
                        todayRecord.valueOrNull?.status == 'open',
                    onTap: () =>
                        context.push('/scanner', extra: {'mode': 'checkout'}),
                  ),
                ),
              ],
            ),

            if (!isInsideGeofence) ...[
              const SizedBox(height: 12),
              const Text(
                'Check-in and check-out buttons are enabled only when you are within 100m of the workplace.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TodaySummaryCard extends StatelessWidget {
  const _TodaySummaryCard({required this.record});
  final dynamic record;

  @override
  Widget build(BuildContext context) {
    if (record == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: const [
              Icon(Icons.info_outline, color: Colors.grey),
              SizedBox(width: 8),
              Text("No attendance recorded today.",
                  style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    String fmtTime(String? iso) {
      if (iso == null) return '—';
      return DateFormat('hh:mm a').format(DateTime.parse(iso).toLocal());
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Today's Attendance",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            Row(
              children: [
                _InfoChip(label: 'Check In', value: fmtTime(record.checkInAt)),
                const SizedBox(width: 12),
                _InfoChip(label: 'Check Out', value: fmtTime(record.checkOutAt)),
              ],
            ),
            const SizedBox(height: 8),
            _StatusBadge(status: record.status as String),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        Text(value,
            style:
                const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final colors = {
      'open': (Colors.green.shade100, Colors.green.shade800),
      'closed': (Colors.blue.shade100, Colors.blue.shade800),
      'incomplete': (Colors.orange.shade100, Colors.orange.shade800),
      'absent': (Colors.grey.shade200, Colors.grey.shade700),
    };
    final (bg, fg) =
        colors[status] ?? (Colors.grey.shade200, Colors.grey.shade700);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
            color: fg, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.enabled,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final Color color;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: enabled ? onTap : null,
      icon: Icon(icon),
      label: Text(label, style: const TextStyle(fontSize: 16)),
      style: ElevatedButton.styleFrom(
        backgroundColor: enabled ? color : Colors.grey.shade300,
        foregroundColor: enabled ? Colors.white : Colors.grey.shade500,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFFEE2E2),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Color(0xFF991B1B)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(message,
                  style: const TextStyle(color: Color(0xFF991B1B))),
            ),
          ],
        ),
      ),
    );
  }
}
