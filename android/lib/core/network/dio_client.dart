import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';

const _kAccessTokenKey = 'access_token';
const _kRefreshTokenKey = 'refresh_token';

final _secureStorage = FlutterSecureStorage(
  aOptions: const AndroidOptions(encryptedSharedPreferences: true),
);

/// Provides a Dio instance with auth interceptors (token refresh on 401).
final dioClientProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: kApiBaseUrl,
      connectTimeout: kConnectTimeout,
      receiveTimeout: kReceiveTimeout,
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(_AuthInterceptor(dio));
  return dio;
});

class _AuthInterceptor extends QueuedInterceptor {
  _AuthInterceptor(this._dio);
  final Dio _dio;

  @override
  Future<void> onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _secureStorage.read(key: _kAccessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
      DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 &&
        !err.requestOptions.path.contains('/auth/')) {
      // Attempt token refresh
      try {
        final refreshToken =
            await _secureStorage.read(key: _kRefreshTokenKey);
        if (refreshToken == null) {
          handler.next(err);
          return;
        }

        final refreshDio = Dio(BaseOptions(baseUrl: kApiBaseUrl));
        final res = await refreshDio.post<Map<String, dynamic>>(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
        );
        final data = res.data!;
        final newAccess = data['accessToken'] as String;
        final newRefresh = data['refreshToken'] as String?;

        await _secureStorage.write(key: _kAccessTokenKey, value: newAccess);
        if (newRefresh != null) {
          await _secureStorage.write(
              key: _kRefreshTokenKey, value: newRefresh);
        }

        // Retry original request
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newAccess';
        final response = await _dio.fetch<dynamic>(opts);
        handler.resolve(response);
        return;
      } catch (_) {
        // Refresh failed – clear tokens
        await _secureStorage.deleteAll();
        handler.next(err);
        return;
      }
    }
    handler.next(err);
  }
}

/// Convenience helpers for token storage (used by auth feature).
abstract class TokenStorage {
  static Future<void> saveTokens(
      {required String access, required String refresh}) async {
    await _secureStorage.write(key: _kAccessTokenKey, value: access);
    await _secureStorage.write(key: _kRefreshTokenKey, value: refresh);
  }

  static Future<String?> getAccessToken() =>
      _secureStorage.read(key: _kAccessTokenKey);

  static Future<void> clearAll() => _secureStorage.deleteAll();
}
