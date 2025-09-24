class ParsedResume {
  final String? name;
  final String? location;
  final String? phone;
  final String? email;
  final String? linkedin;
  final List<Section> sections;

  ParsedResume({
    this.name,
    this.location,
    this.phone,
    this.email,
    this.linkedin,
    required this.sections,
  });

  factory ParsedResume.fromJson(Map<String, dynamic> json) {
    final sectionsJson = (json['sections'] as List?) ?? [];
    return ParsedResume(
      name: json['name'] as String?,
      location: json['location'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      linkedin: json['linkedin'] as String?,
      sections: sectionsJson.map((e) => Section.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

class Section {
  final String? title;
  final dynamic content; // keep dynamic to allow existing server shape

  Section({this.title, this.content});

  factory Section.fromJson(Map<String, dynamic> json) {
    return Section(
      title: json['title'] as String?,
      content: json['content'],
    );
  }
}
