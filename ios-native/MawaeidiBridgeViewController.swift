import Foundation
import Capacitor

// Registered in Main.storyboard by scripts/prepare-ios-project.mjs.
class MawaeidiBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MawaeidiAlarmPlugin())
    }
}
