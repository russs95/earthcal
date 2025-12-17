//
//  WebViewController.swift
//  earthcal_mac
//
//  Created by Earthen Labs on 17/12/25.
//

import Foundation
import WebKit
import AppKit

final class WebViewController: ObservableObject {
    weak var webView: WKWebView?

    // MARK: - Actions used by menus

    func reload() {
        webView?.reload()
    }

    func startGuidedTour() {
        let js = "window.dispatchEvent(new Event('earthcal-start-guided-tour'))"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func openEarthCalOnline() {
        open(urlString: "https://cycles.earthen.io")
    }

    func openCalendarGuide() {
        open(urlString: "https://guide.earthen.io/")
    }

    func openAboutSite() {
        open(urlString: "https://earthen.io/cycles/")
    }

    func showAboutDialog() {
        let alert = NSAlert()
        alert.messageText = "EarthCal"
        alert.informativeText = "Sync your moments with Earth's cycles."
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    func showLicenseDialog() {
        let alert = NSAlert()
        alert.messageText = "EarthCal License"
        alert.informativeText = """
        The EarthCal concept and code are licensed under the
        Creative Commons Attribution-NonCommercial-ShareAlike 4.0
        International (CC BY-NC-SA 4.0) License.
        """
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    // MARK: - Helpers

    private func open(urlString: String) {
        guard let url = URL(string: urlString) else { return }
        NSWorkspace.shared.open(url)
    }
}

