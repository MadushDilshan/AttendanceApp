import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../core/network/dio_client.dart';
import '../models/employee.dart';
import '../repositories/auth_repository.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../geofence/providers/geofence_provider.dart';
import '../../offline_queue/providers/sync_provider.dart';

part 'auth_provider.freezed.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState({
    Employee? employee,
    @Default(false) bool isAuthenticated,
    @Default(false) bool isLoading,
    String? error,
  }) = _AuthState;
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    // Check if a token exists on startup
    final token = await TokenStorage.getAccessToken();
    if (token != null) {
      // Token exists, try to restore session
      // (A real app could validate the token or decode it)
      return const AuthState(isAuthenticated: true);
    }
    return const AuthState();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncData(AuthState(isLoading: true));
    try {
      final repo = ref.read(authRepositoryProvider);
      final result = await repo.login(email: email, password: password);
      await TokenStorage.saveTokens(
        access: result.accessToken,
        refresh: result.refreshToken,
      );

      // Invalidate all cached data from previous user
      ref.invalidate(todayRecordProvider);
      ref.invalidate(workplaceProvider);
      ref.invalidate(syncServiceProvider);

      state = AsyncData(AuthState(
        employee: result.employee,
        isAuthenticated: true,
      ));
    } catch (e) {
      state = AsyncData(AuthState(error: e.toString()));
    }
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();
    state = const AsyncData(AuthState());
  }
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
