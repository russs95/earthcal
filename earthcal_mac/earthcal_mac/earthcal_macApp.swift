//
//  earthcal_macApp.swift
//  earthcal_mac
//
//  Created by Earthen Labs on 16/12/25.
//

import SwiftUI

@main
struct earthcal_macApp: App {
    init() {
        LocalWebServer.shared.start()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

