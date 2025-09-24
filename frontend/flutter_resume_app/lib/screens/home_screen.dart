import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart'; // For PlatformFile
import '../services/api_service.dart';
import '../models/parsed_resume.dart';
import '../utils/logger.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PlatformFile? _selectedFile;
  bool _isUploading = false;
  ParsedResume? _result;
  String? _error;

  Future<void> _pickFile() async {
    setState(() {
      _error = null;
      _result = null;
    });
    try {
      final res = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
        withData: kIsWeb, // Critical for web
      );

      if (res != null) {
        setState(() {
          _selectedFile = res.files.single;
        });
        AppLogger.i('Selected file: ${_selectedFile?.name}');
      }
    } catch (e) {
      setState(() => _error = 'File pick error: $e');
      AppLogger.e('File pick error', e);
    }
  }

  Future<void> _upload() async {
    if (_selectedFile == null) {
      setState(() => _error = 'Please select a PDF or DOC/DOCX file first.');
      return;
    }
    setState(() {
      _isUploading = true;
      _error = null;
      _result = null;
    });

    try {
      final res = await ApiService.uploadResume(_selectedFile!);
      setState(() => _result = res);
    } catch (e) {
      setState(() => _error = 'Upload failed: $e');
      AppLogger.e('Upload failed', e);
    } finally {
      setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resume Parser'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ElevatedButton.icon(
                  icon: const Icon(Icons.attach_file),
                  onPressed: _isUploading ? null : _pickFile,
                  label: const Text('Pick File'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedFile?.name ?? 'No file selected',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.cloud_upload),
              onPressed: _isUploading ? null : _upload,
              label: _isUploading ? const Text('Uploading...') : const Text('Upload'),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            const SizedBox(height: 12),
            const Text('Result', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Expanded(
              child: _result != null
                  ? SingleChildScrollView(
                      child: _ResultView(result: _result!),
                    )
                  : const Text('No result yet.'),
            )
          ],
        ),
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  final ParsedResume result;
  const _ResultView({required this.result});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _kv('Name', result.name),
        _kv('Email', result.email),
        _kv('Phone', result.phone),
        _kv('LinkedIn', result.linkedin),
        _kv('Location', result.location),
        const SizedBox(height: 8),
        const Text('Sections', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        if (result.sections.isNotEmpty)
          ...result.sections.map((s) => _sectionCard(s)).toList()
        else
          const Text('No sections'),
      ],
    );
  }

  Widget _kv(String k, String? v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text('$k: ', style: const TextStyle(fontWeight: FontWeight.w600))),
          Expanded(child: Text(v ?? '—')),
        ],
      ),
    );
  }

  Widget _sectionCard(Section s) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.title ?? '(Untitled Section)', style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            if (s.content != null) Text(s.content.toString()),
          ],
        ),
      ),
    );
  }
}