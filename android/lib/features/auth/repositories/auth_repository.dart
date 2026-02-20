import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_client.dart';
import '../models/employee.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  Future<({Employee employee, String accessToken, String refreshToken})> login({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = res.data!;
    final employee = Employee.fromJson(
        (data['employee'] as Map<String, dynamic>)
            .map((k, v) => MapEntry(k == '_id' ? 'id' : k, v)));
    return (
      employee: employee,
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  Future<void> logout() async {
    try {
      await _dio.post<void>('/auth/logout');
    } catch (_) {
      // Best-effort
    }
    await TokenStorage.clearAll();
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioClientProvider)),
);
