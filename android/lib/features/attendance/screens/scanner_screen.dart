import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../providers/attendance_provider.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key, required this.mode});
  final String mode; // 'checkin' | 'checkout'

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final _controller = MobileScannerController();
  bool _processed = false;

  String get _title =>
      widget.mode == 'checkin' ? 'Scan to Check In' : 'Scan to Check Out';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onQrDetected(String qrToken) async {
    if (_processed) return;
    _processed = true;
    await _controller.stop();

    // Get current location
    Position position;
    try {
      position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Could not get GPS location. Please try again.')),
        );
        context.pop();
      }
      return;
    }

    final notifier = ref.read(attendanceActionProvider.notifier);
    final bool success;
    if (widget.mode == 'checkin') {
      success = await notifier.performCheckIn(
          qrToken: qrToken, position: position);
    } else {
      success = await notifier.performCheckOut(
          qrToken: qrToken, position: position);
    }

    if (mounted) {
      final actionState = ref.read(attendanceActionProvider);
      final msg = actionState.successMessage ?? actionState.error ?? 'Done.';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(msg)));
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              final barcode = capture.barcodes.firstOrNull;
              if (barcode?.rawValue != null) {
                _onQrDetected(barcode!.rawValue!);
              }
            },
          ),
          // Overlay frame
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Text(
              'Point camera at the workplace QR code',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 14,
                  shadows: [Shadow(color: Colors.black54, blurRadius: 4)]),
            ),
          ),
        ],
      ),
    );
  }
}
