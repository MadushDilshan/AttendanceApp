import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../core/network/dio_client.dart';
import '../models/employee.dart';
import '../repositories/auth_repository.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../geofence/providers/geofence_provider.dart';
import '../../offline_queue/providers/sync_provider.dart';

part 'auth_provider.freezed.dart';

const _kEmployeeKey = 'employee_json';

const _secureStorage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

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
    final token = await TokenStorage.getAccessToken();
    if (token != null) {
      // Restore saved employee data
      final employeeJson = await _secureStorage.read(key: _kEmployeeKey);
      Employee? employee;
      if (employeeJson != null) {
        try {
          employee = Employee.fromJson(
              jsonDecode(employeeJson) as Map<String, dynamic>);
        } catch (_) {}
      }
      return AuthState(isAuthenticated: true, employee: employee);
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
      await _secureStorage.write(
        key: _kEmployeeKey,
        value: jsonEncode(result.employee.toJson()),
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
    await _secureStorage.delete(key: _kEmployeeKey);
    state = const AsyncData(AuthState());
  }
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
