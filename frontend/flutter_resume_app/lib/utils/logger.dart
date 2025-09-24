class AppLogger {
  static void i(Object message) {
    // info
    // ignore: avoid_print
    print('[INFO] $message');
  }

  static void e(String context, Object error) {
    // ignore: avoid_print
    print('[ERROR] $context: $error');
  }
}
