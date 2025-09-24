import 'dart:convert';
import 'dart:io' as io;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import '../models/parsed_resume.dart';
import '../utils/logger.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000';

  static Future<ParsedResume> uploadResume(PlatformFile file) async {
    final uri = Uri.parse('$baseUrl/upload');
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

    final streamed = await request.send();
    final resp = await http.Response.fromStream(streamed);

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