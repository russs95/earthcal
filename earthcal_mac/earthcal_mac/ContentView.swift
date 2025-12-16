import SwiftUI

struct ContentView: View {
    var body: some View {
        EarthCalWebView()
            .frame(minWidth: 800, minHeight: 600)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(WebViewController())
    }
}
