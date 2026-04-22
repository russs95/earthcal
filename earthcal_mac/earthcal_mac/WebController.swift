//
//  WebController.swift
//  earthcal_mac
//
//  Created by Earthen Labs on 17/12/25.
//

import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
    @EnvironmentObject var controller: WebViewController

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // Inject a platform flag before any page script runs so JS can reliably
        // detect it is running inside the native macOS app (not Snap/web).
        let platformScript = WKUserScript(
            source: "window.EARTHCAL_PLATFORM = 'macos';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        config.userContentController.addUserScript(platformScript)

        let webView = WKWebView(frame: .zero, configuration: config)

        #if DEBUG
        webView.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        #endif

        // Let the controller drive this webView (for Reload, Guided Tour, etc.)
        controller.webView = webView

        loadFromLocalServer(in: webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        // nothing for now
    }

    private func loadFromLocalServer(in webView: WKWebView) {
        guard let url = URL(string: "http://127.0.0.1:3000/index.html") else {
            print("❌ Invalid localhost URL")
            return
        }

        webView.load(URLRequest(url: url))
    }
}
