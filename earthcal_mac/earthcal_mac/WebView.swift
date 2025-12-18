import SwiftUI
import WebKit

struct EarthCalWebView: NSViewRepresentable {
    @EnvironmentObject var controller: WebViewController

    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)

        #if DEBUG
        webView.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        #endif

        controller.webView = webView

        loadFromLocalServer(in: webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        // no-op for now
    }

    private func loadFromLocalServer(in webView: WKWebView) {
        guard let url = URL(string: "http://127.0.0.1:3000/index.html") else {
            print("❌ Invalid localhost URL")
            return
        }

        webView.load(URLRequest(url: url))
    }
}
