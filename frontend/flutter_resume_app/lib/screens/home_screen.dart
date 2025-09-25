import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart'; // For PlatformFile
import 'package:url_launcher/url_launcher.dart';
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
            _FilePickerCard(
              selectedFile: _selectedFile,
              isUploading: _isUploading,
              onPick: _isUploading ? null : _pickFile,
            ),
            const SizedBox(height: 12),
            _UploadButton(
              isUploading: _isUploading,
              onUpload: _isUploading ? null : _upload,
            ),
            const SizedBox(height: 12),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: _error != null
                  ? Container(
                      key: const ValueKey('error'),
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text(_error!, style: const TextStyle(color: Colors.red)),
                    )
                  : const SizedBox.shrink(),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _result != null
                    ? SingleChildScrollView(
                        key: const ValueKey('result'),
                        child: _ResultView(result: _result!),
                      )
                    : const _EmptyState(),
              ),
            ),
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
        Card(
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.person, size: 20),
                    SizedBox(width: 8),
                    Text('Overview', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                _KeyValue('Name', result.name),
                _LinkValue.email(result.email),
                _KeyValue('Phone', result.phone),
                _LinkValue.web('LinkedIn', result.linkedin),
                _KeyValue('Location', result.location),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.list_alt, size: 20),
                    SizedBox(width: 8),
                    Text('Sections', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                if (result.sections.isNotEmpty)
                  ...result.sections.map((s) => _SectionCard(s)).toList()
                else
                  const Text('No sections'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Reusable key-value row with graceful fallback
  // Kept as a separate widget for readability and reuse
  // Shows '—' when value is null/empty
}

class _KeyValue extends StatelessWidget {
  final String label;
  final String? value;
  const _KeyValue(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(value == null || value!.trim().isEmpty ? '—' : value!),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final Section s;
  const _SectionCard(this.s);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        initiallyExpanded: true,
        tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        title: Text(s.title ?? '(Untitled Section)', style: const TextStyle(fontWeight: FontWeight.w600)),
        children: [
          _SectionContent(title: s.title, content: s.content),
        ],
      ),
    );
  }
}

class _SectionContent extends StatelessWidget {
  final String? title;
  final dynamic content;
  const _SectionContent({required this.title, required this.content});

  bool _titleContains(String keyword) => (title ?? '').toLowerCase().contains(keyword);

  @override
  Widget build(BuildContext context) {
    if (content == null) return const Text('—');

    // Normalize common section types by title heuristics
    if (_titleContains('skill')) {
      final items = _extractListOfStrings(content);
      if (items.isNotEmpty) {
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items.map((e) => Chip(label: Text(e))).toList(),
        );
      }
    }

    if (_titleContains('experience') || _titleContains('work')) {
      final experiences = _extractListOfMaps(content);
      if (experiences.isNotEmpty) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: experiences.map((exp) => _ExperienceItem(exp: exp)).toList(),
        );
      }
    }

    if (_titleContains('education')) {
      final educations = _extractListOfMaps(content);
      if (educations.isNotEmpty) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: educations.map((ed) => _EducationItem(ed: ed)).toList(),
        );
      }
    }

    // Generic fallbacks
    if (content is List) {
      final list = content as List;
      if (list.isEmpty) return const Text('—');
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: list.map<Widget>((e) => _bullet(e.toString())).toList(),
      );
    }
    if (content is Map) {
      final map = (content as Map).cast<String, dynamic>();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: map.entries.map((e) => _kvRow(e.key, e.value?.toString() ?? '—')).toList(),
      );
    }
    return Text(content.toString());
  }

  List<String> _extractListOfStrings(dynamic content) {
    if (content is List) {
      return content.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList();
    }
    if (content is Map && content['items'] is List) {
      return (content['items'] as List).map((e) => e.toString()).toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> _extractListOfMaps(dynamic content) {
    if (content is List) {
      return content.whereType<Map>().map((m) => m.cast<String, dynamic>()).toList();
    }
    if (content is Map && content['items'] is List) {
      return (content['items'] as List)
          .whereType<Map>()
          .map((m) => m.cast<String, dynamic>())
          .toList();
    }
    return const [];
  }

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• '),
            Expanded(child: Text(text)),
          ],
        ),
      );

  Widget _kvRow(String k, String v) => Padding(
        padding: const EdgeInsets.only(bottom: 4.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 100, child: Text(k, style: const TextStyle(fontWeight: FontWeight.w600))),
            const SizedBox(width: 8),
            Expanded(child: Text(v.isEmpty ? '—' : v)),
          ],
        ),
      );
}

class _ExperienceItem extends StatelessWidget {
  final Map<String, dynamic> exp;
  const _ExperienceItem({required this.exp});

  @override
  Widget build(BuildContext context) {
    final title = _firstNonEmpty([exp['title'], exp['role'], exp['position']]);
    final company = _firstNonEmpty([exp['company'], exp['organization'], exp['employer']]);
    final start = _firstNonEmpty([exp['start'], exp['startDate'], exp['from']]);
    final end = _firstNonEmpty([exp['end'], exp['endDate'], exp['to']]);
    final dates = (start != null || end != null) ? '${start ?? ''} — ${end ?? 'Present'}' : null;
    final summary = exp['summary']?.toString();
    final points = (exp['bullets'] ?? exp['points'] ?? exp['highlights']) as dynamic;
    final bullets = points is List ? points.map((e) => e.toString()).toList() : <String>[];

    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.work_outline, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  [title, company].whereType<String>().where((e) => e.trim().isNotEmpty).join(' · '),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          if (dates != null && dates.trim().isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(dates, style: Theme.of(context).textTheme.bodySmall),
          ],
          if (summary != null && summary.trim().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(summary),
          ],
          if (bullets.isNotEmpty) ...[
            const SizedBox(height: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: bullets.map((b) => _bullet(b)).toList(),
            ),
          ],
        ],
      ),
    );
  }

  String? _firstNonEmpty(List<dynamic> candidates) {
    for (final c in candidates) {
      if (c is String && c.trim().isNotEmpty) return c;
    }
    return null;
  }

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 2.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• '),
            const SizedBox(width: 2),
            Expanded(child: Text(text)),
          ],
        ),
      );
}

class _LinkValue extends StatelessWidget {
  final String label;
  final String? value;
  final bool isEmail;

  const _LinkValue.web(this.label, this.value) : isEmail = false;
  const _LinkValue.email(String? email)
      : label = 'Email',
        value = email,
        isEmail = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final display = value == null || value!.trim().isEmpty ? '—' : value!.trim();
    final isClickable = display != '—';

    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: isClickable
                ? InkWell(
                    onTap: () => _launch(value!, isEmail: isEmail),
                    child: Text(
                      display,
                      style: TextStyle(color: theme.colorScheme.primary, decoration: TextDecoration.underline),
                    ),
                  )
                : const Text('—'),
          ),
        ],
      ),
    );
  }

  Future<void> _launch(String raw, {required bool isEmail}) async {
    try {
      final Uri uri = isEmail
          ? Uri(scheme: 'mailto', path: raw)
          : _ensureHttp(raw);
      if (!await launchUrl(uri, mode: LaunchMode.platformDefault)) {
        // ignore: avoid_print
        print('Could not launch: $uri');
      }
    } catch (e) {
      // ignore: avoid_print
      print('Launch error: $e');
    }
  }

  Uri _ensureHttp(String url) {
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return Uri.parse(trimmed);
    }
    return Uri.parse('https://$trimmed');
  }
}

class _EducationItem extends StatelessWidget {
  final Map<String, dynamic> ed;
  const _EducationItem({required this.ed});

  @override
  Widget build(BuildContext context) {
    final degree = _firstNonEmpty([ed['degree'], ed['qualification'], ed['program']]);
    final school = _firstNonEmpty([ed['institution'], ed['school'], ed['university'], ed['college']]);
    final start = _firstNonEmpty([ed['start'], ed['startDate'], ed['from']]);
    final end = _firstNonEmpty([ed['end'], ed['endDate'], ed['to']]);
    final dates = (start != null || end != null) ? '${start ?? ''} — ${end ?? ''}' : null;
    final gpa = ed['gpa']?.toString();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.school_outlined, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  [degree, school].whereType<String>().where((e) => e.trim().isNotEmpty).join(' · '),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          if (dates != null && dates.trim().isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(dates, style: Theme.of(context).textTheme.bodySmall),
          ],
          if (gpa != null && gpa.trim().isNotEmpty) ...[
            const SizedBox(height: 2),
            Text('GPA: $gpa'),
          ],
        ],
      ),
    );
  }

  String? _firstNonEmpty(List<dynamic> candidates) {
    for (final c in candidates) {
      if (c is String && c.trim().isNotEmpty) return c;
    }
    return null;
  }
}

class _FilePickerCard extends StatelessWidget {
  final PlatformFile? selectedFile;
  final bool isUploading;
  final VoidCallback? onPick;
  const _FilePickerCard({
    required this.selectedFile,
    required this.isUploading,
    required this.onPick,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.primary.withOpacity(0.25)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: isUploading ? null : onPick,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 18.0, horizontal: 16),
          child: Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                padding: const EdgeInsets.all(10),
                child: Icon(Icons.cloud_upload, color: theme.colorScheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      selectedFile?.name ?? 'Click to upload your resume',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Supported: PDF, DOC, DOCX',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: isUploading ? null : onPick,
                icon: const Icon(Icons.attach_file),
                label: Text(selectedFile == null ? 'Browse' : 'Change'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UploadButton extends StatelessWidget {
  final bool isUploading;
  final VoidCallback? onUpload;
  const _UploadButton({required this.isUploading, required this.onUpload});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        icon: isUploading
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : const Icon(Icons.cloud_upload),
        onPressed: onUpload,
        label: Text(isUploading ? 'Uploading...' : 'Upload'),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.insert_drive_file, size: 40, color: theme.hintColor),
          const SizedBox(height: 8),
          Text('No result yet.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
        ],
      ),
    );
  }
}