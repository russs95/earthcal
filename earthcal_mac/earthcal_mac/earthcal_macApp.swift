import SwiftUI

@main
struct earthcal_macApp: App {
    @StateObject private var webViewController = WebViewController()

    init() {
        LocalWebServer.shared.start()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(webViewController)
        }
        .defaultSize(CGSize(width: 1028, height: 769))
        .commands {
            CommandGroup(replacing: .appInfo) {
                Button("About EarthCal") {
                    webViewController.showAboutDialog()
                }
            }

            CommandMenu("View") {
                Button("Reload") {
                    webViewController.reload()
                }
                .keyboardShortcut("r", modifiers: [.command])

                Button("Start Guided Tour") {
                    webViewController.startGuidedTour()
                }
            }

            CommandMenu("Help") {
                Button("EarthCal Online") {
                    webViewController.openEarthCalOnline()
                }
                Button("Calendar Guide Wiki") {
                    webViewController.openCalendarGuide()
                }
                Divider()
                Button("Created by Earthen.io") {
                    webViewController.openAboutSite()
                }
                Button("License") {
                    webViewController.showLicenseDialog()
                }
            }
        }
    }
}
