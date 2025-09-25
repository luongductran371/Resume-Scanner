import 'dart:convert';
import 'dart:io' as io;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import '../models/parsed_resume.dart';
import '../utils/logger.dart';

class ApiService {
  // Prefer override from --dart-define=BASE_URL=http://<host>:3000
  static const String _envBaseUrl = String.fromEnvironment('BASE_URL');

  // Get base URL based on platform with sensible defaults.
  // - Web: localhost (same machine)
  // - Android: 10.0.2.2 (emulator host loopback). For physical device, pass BASE_URL via --dart-define
  // - Desktop/iOS: localhost
  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) return _envBaseUrl;
    if (kIsWeb) return 'http://localhost:3000';
    if (io.Platform.isAndroid) return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }

  static Future<ParsedResume> uploadResume(PlatformFile file) async {
    final uri = Uri.parse('$baseUrl/upload');

    // Quick reachability check to fail fast on wrong BASE_URL (e.g., 10.0.2.2 on physical device)
    try {
      final health = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 5));
      AppLogger.i('Health check: ${health.statusCode}');
    } catch (e) {
      throw 'Cannot reach API at $baseUrl. If running on a physical Android device, run with --dart-define=BASE_URL=http://<YOUR_PC_IP>:3000 and ensure your server listens on 0.0.0.0';
    }

    final request = http.MultipartRequest('POST', uri);

    if (kIsWeb) {
      // Web: use bytes
      if (file.bytes == null) throw 'No file bytes available for web upload';
      request.files.add(
        http.MultipartFile.fromBytes(
          'resume',
          file.bytes!,
          filename: file.name,
          contentType: _guessContentType(file.name),
        ),
      );
    } else {
      // Mobile/Desktop: use path
      if (file.path == null) throw 'No file path available';
      request.files.add(
        await http.MultipartFile.fromPath(
          'resume',
          file.path!,
          filename: file.name,
          contentType: _guessContentType(file.name),
        ),
      );
    }

    AppLogger.i('Uploading ${file.name} to $uri');

    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final resp = await http.Response.fromStream(streamed).timeout(const Duration(seconds: 30));

    AppLogger.i('Response status: ${resp.statusCode}');

    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      final jsonMap = jsonDecode(resp.body) as Map<String, dynamic>;
      return ParsedResume.fromJson(jsonMap);
    } else {
      throw 'Server error: ${resp.statusCode} ${resp.reasonPhrase}';
    }
  }

  static MediaType? _guessContentType(String filename) {
    final lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return MediaType('application', 'pdf');
    if (lower.endsWith('.docx')) {
      return MediaType('application', 'vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    if (lower.endsWith('.doc')) return MediaType('application', 'msword');
    return null;
  }
}