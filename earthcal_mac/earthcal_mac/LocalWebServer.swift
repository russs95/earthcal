import Foundation
import Swifter

final class LocalWebServer {
    static let shared = LocalWebServer()

    private let server = HttpServer()
    private(set) var isRunning = false

    private init() {}

    func start() {
        guard !isRunning else { return }

        guard let resourcePath = Bundle.main.resourcePath else {
            print("❌ Could not find bundle resourcePath")
            return
        }

        print("📁 Serving from: \(resourcePath)")

        // Log every incoming request
        #if DEBUG
        server.middleware.append { request in
            print("➡️ Incoming request: \(request.method) \(request.path)")
            return nil
        }
        #endif

        // Health check
        server["/test"] = { _ in
            print("✅ /test route hit")
            return .ok(.htmlBody("<h1>EarthCal Local Server OK</h1>"))
        }

        // Root & explicit index
        server["/"] = { _ in
            self.serveFile("index.html", from: resourcePath)
        }
        server["/index.html"] = { _ in
            self.serveFile("index.html", from: resourcePath)
        }

        // 🔁 Fallback for *any* other path (assets, js, css, svgs, webp, etc.)
        server.notFoundHandler = { request in
            print("🔁 Fallback handler for \(request.method) \(request.path)")

            var relative = request.path  // e.g. "/assets/icons/whale.svg"
            if relative.hasPrefix("/") {
                relative.removeFirst()   // "assets/icons/whale.svg"
            }
            if relative.isEmpty {
                relative = "index.html"
            }

            return self.serveFile(relative, from: resourcePath)
        }

        do {
            try server.start(3000, forceIPv4: true)
            isRunning = true
            print("🟢 LocalWebServer started at http://127.0.0.1:3000")
        } catch {
            print("❌ Failed to start LocalWebServer:", error)
        }
    }


    func stop() {
        guard isRunning else { return }
        server.stop()
        isRunning = false
        print("🛑 LocalWebServer stopped")
    }

    // MARK: - Helpers

    private func serveFromFolder(_ folder: String, request: HttpRequest, root: String) -> HttpResponse {
        let tail = request.params[":path"] ?? ""
        let relative = folder + "/" + tail
        return serveFile(relative, from: root)
    }

    private func serveFile(_ relativePath: String, from root: String) -> HttpResponse {
        // Normalize path (strip leading /)
        var rel = relativePath
        if rel.hasPrefix("/") {
            rel.removeFirst()
        }
        if rel.isEmpty {
            rel = "index.html"
        }

        let baseURL = URL(fileURLWithPath: root).appendingPathComponent(rel)
        var isDir: ObjCBool = false

        // Does the path exist, and is it a directory?
        if FileManager.default.fileExists(atPath: baseURL.path, isDirectory: &isDir) {
            let fileURL: URL

            if isDir.boolValue {
                // If it's a directory (e.g. auth/callback), serve auth/callback/index.html
                fileURL = baseURL.appendingPathComponent("index.html")
                print("📂 Path is a directory, trying index.html inside:", fileURL.path)
            } else {
                fileURL = baseURL
            }

            do {
                let data = try Data(contentsOf: fileURL)
                let mime = mimeType(for: fileURL.path)
                print("📄 Serving file:", fileURL.path, "as", mime)
                return .raw(200, "OK", ["Content-Type": mime]) { writer in
                    try? writer.write(data)
                }
            } catch {
                print("❌ There was an error reading file:", error)
                return .internalServerError
            }
        } else {
            print("❌ File not found:", baseURL.path)
            return .notFound
        }
    }


    private func mimeType(for path: String) -> String {
        if path.hasSuffix(".html") { return "text/html; charset=utf-8" }
        if path.hasSuffix(".js")   { return "application/javascript" }
        if path.hasSuffix(".css")  { return "text/css" }
        if path.hasSuffix(".svg")  { return "image/svg+xml" }
        if path.hasSuffix(".png")  { return "image/png" }
        if path.hasSuffix(".jpg") || path.hasSuffix(".jpeg") { return "image/jpeg" }
        if path.hasSuffix(".webp") { return "image/webp" }
        if path.hasSuffix(".json") { return "application/json" }
        if path.hasSuffix(".ttf")  { return "font/ttf" }
        return "application/octet-stream"
    }
}
