import Foundation
import Capacitor
import UIKit
import UserNotifications

// iOS 15–25 fallback: local notifications, not a continuously ringing Android-style alarm.
// AlarmKit on iOS 26+ will be a separate, explicitly authorized enhancement.
@objc(MawaeidiAlarmPlugin)
public class MawaeidiAlarmPlugin: CAPPlugin, CAPBridgedPlugin, UNUserNotificationCenterDelegate {
    public let identifier = "MawaeidiAlarmPlugin"
    public let jsName = "MawaeidiAlarm"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAppInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "replaceAlarms", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "testAlarm", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openNotificationSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openExactAlarmSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openFullScreenSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openBatterySettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "chooseAlarmTone", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openExternalUrl", returnType: CAPPluginReturnPromise)
    ]

    private let enabledKey = "mawaeidi.ios.notifications.enabled"
    private let userKey = "mawaeidi.ios.notifications.user"
    private let idPrefix = "mawaeidi.lesson."
    private let maxScheduled = 55   // iOS retains at most 64 pending local notifications.
    private var enabled: Bool { UserDefaults.standard.bool(forKey: enabledKey) }
    private var center: UNUserNotificationCenter { UNUserNotificationCenter.current() }

    override public func load() {
        center.delegate = self
        let category = UNNotificationCategory(identifier: "MAWAEIDI_LESSON",
                                              actions: [], intentIdentifiers: [], options: [])
        center.setNotificationCategories([category])
    }

    // Show a banner even when the foreground WKWebView is open.
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                      willPresent notification: UNNotification,
                                      withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .list])
    }

    private func managedIDs(_ requests: [UNNotificationRequest]) -> [String] {
        requests.map { $0.identifier }.filter { $0.hasPrefix(idPrefix) }
    }

    private func state(_ completion: @escaping ([String: Any]) -> Void) {
        center.getNotificationSettings { [weak self] settings in
            guard let self = self else { return }
            self.center.getPendingNotificationRequests { requests in
                let permitted = settings.authorizationStatus == .authorized ||
                    settings.authorizationStatus == .provisional
                completion([
                    "enabled": self.enabled,
                    "notificationsAllowed": permitted,
                    "exactAlarmAllowed": false,  // No AlarmKit alarm configured yet.
                    "fullScreenAllowed": false,
                    "batteryOptimizationIgnored": true,
                    "pendingCount": self.managedIDs(requests).count,
                    "platform": "ios",
                    "alarmMode": "local_notification",
                    "maxScheduled": self.maxScheduled
                ])
            }
        }
    }

    @objc public func getState(_ call: CAPPluginCall) {
        state { value in call.resolve(value) }
    }

    @objc public func getAppInfo(_ call: CAPPluginCall) {
        let info = Bundle.main.infoDictionary ?? [:]
        call.resolve([
            "packageName": Bundle.main.bundleIdentifier ?? "com.abdelmalek.mawaeidi",
            "versionName": info["CFBundleShortVersionString"] as? String ?? "0.1.0",
            "versionCode": Int(info["CFBundleVersion"] as? String ?? "1") ?? 1
        ])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        center.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if let error = error {
                call.reject("تعذّر طلب إذن الإشعارات.", "ios_notification_permission_failed", error)
            } else if !granted {
                call.reject("يجب السماح بالإشعارات من إعدادات iPhone.", "ios_notification_permission_denied")
            } else {
                self.state { value in call.resolve(value) }
            }
        }
    }

    @objc public func setEnabled(_ call: CAPPluginCall) {
        let active = call.getBool("enabled") ?? false
        let uid = String((call.getString("userId") ?? "").prefix(120))
        let oldID = UserDefaults.standard.string(forKey: userKey) ?? ""
        if !active || (!oldID.isEmpty && !uid.isEmpty && oldID != uid) {
            // Do not leave previous account's lessons scheduled after switching users.
            center.getPendingNotificationRequests { requests in
                self.center.removePendingNotificationRequests(withIdentifiers: self.managedIDs(requests))
            }
        }
        UserDefaults.standard.set(active, forKey: enabledKey)
        UserDefaults.standard.set(active ? uid : "", forKey: userKey)
        state { value in call.resolve(value) }
    }

    @objc public func cancelAll(_ call: CAPPluginCall) {
        center.getPendingNotificationRequests { requests in
            self.center.removePendingNotificationRequests(withIdentifiers: self.managedIDs(requests))
            self.state { value in call.resolve(value) }
        }
    }

    private func notification(for item: [String: Any], now: Date) -> UNNotificationRequest? {
        guard let rawID = item["id"] as? String, !rawID.isEmpty else { return nil }
        let epoch = (item["fireAt"] as? NSNumber)?.doubleValue ??
                    (item["fireAt"] as? Double) ?? 0
        let date = Date(timeIntervalSince1970: epoch / 1000)
        guard date.timeIntervalSince(now) >= 5,
              date.timeIntervalSince(now) < 370 * 24 * 3600 else { return nil }

        let content = UNMutableNotificationContent()
        content.title = String((item["title"] as? String ?? "موعد حصة في مواعيدي").prefix(100))
        let lesson = String((item["lessonName"] as? String ?? "حصة").prefix(160))
        let body = String((item["body"] as? String ?? "").prefix(220))
        content.body = [lesson, body].filter { !$0.isEmpty }.joined(separator: "\n")
        content.sound = .default
        content.categoryIdentifier = "MAWAEIDI_LESSON"
        content.userInfo = ["mawaeidiLessonID": String((item["lessonId"] as? String ?? "").prefix(100))]
        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute, .second], from: date
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        return UNNotificationRequest(identifier: idPrefix + String(rawID.prefix(180)),
                                     content: content, trigger: trigger)
    }

    @objc public func replaceAlarms(_ call: CAPPluginCall) {
        guard enabled else {
            state { value in call.resolve(value.merging(["scheduledCount": 0]) { _, next in next }) }
            return
        }
        let records = call.getArray("alarms") as? [[String: Any]] ?? []
        let now = Date()
        var notifications: [UNNotificationRequest] = []
        for record in records {
            if let request = notification(for: record, now: now) {
                notifications.append(request)
            }
        }
        notifications.sort { first, second in
            let firstDate = first.trigger?.nextTriggerDate() ?? Date.distantFuture
            let secondDate = second.trigger?.nextTriggerDate() ?? Date.distantFuture
            return firstDate < secondDate
        }
        let chosen = Array(notifications.prefix(maxScheduled))

        center.getPendingNotificationRequests { existing in
            self.center.removePendingNotificationRequests(withIdentifiers: self.managedIDs(existing))
            let group = DispatchGroup()
            let counterLock = NSLock()
            var count = 0
            for request in chosen {
                group.enter()
                self.center.add(request) { error in
                    if error == nil {
                        counterLock.lock()
                        count += 1
                        counterLock.unlock()
                    }
                    group.leave()
                }
            }
            group.notify(queue: .main) {
                self.state { value in
                    call.resolve(value.merging(["scheduledCount": count]) { _, next in next })
                }
            }
        }
    }

    @objc public func testAlarm(_ call: CAPPluginCall) {
        let delay = max(2, min(call.getInt("delaySeconds") ?? 3, 30))
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized ||
                  settings.authorizationStatus == .provisional else {
                call.reject("فعّل إشعارات مواعيدي أولًا.", "ios_notifications_disabled")
                return
            }
            let content = UNMutableNotificationContent()
            content.title = "اختبار تنبيهات مواعيدي"
            content.body = "إذا ظهر الإشعار وسمعت صوته، فتنبيهات iPhone تعمل."
            content.sound = .default
            content.categoryIdentifier = "MAWAEIDI_LESSON"
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(delay), repeats: false)
            let request = UNNotificationRequest(identifier: self.idPrefix + "test." + UUID().uuidString,
                                                content: content, trigger: trigger)
            self.center.add(request) { error in
                if let error = error { call.reject(error.localizedDescription, "ios_test_failed", error) }
                else { call.resolve(["scheduled": true, "fireAt": Date().timeIntervalSince1970 * 1000 + Double(delay) * 1000]) }
            }
        }
    }

    private func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("تعذّر فتح إعدادات iPhone.")
                return
            }
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened { call.resolve(["opened": true]) }
                else { call.reject("تعذّر فتح إعدادات iPhone.") }
            }
        }
    }

    @objc public func openNotificationSettings(_ call: CAPPluginCall) { openAppSettings(call) }
    @objc public func openExactAlarmSettings(_ call: CAPPluginCall) { openAppSettings(call) }
    @objc public func openFullScreenSettings(_ call: CAPPluginCall) { openAppSettings(call) }
    @objc public func openBatterySettings(_ call: CAPPluginCall) { openAppSettings(call) }

    @objc public func chooseAlarmTone(_ call: CAPPluginCall) {
        call.unavailable("اختيار نغمة من قائمة Android غير مدعوم في iOS. يستخدم الإشعار صوت iPhone الافتراضي.")
    }

    @objc public func openExternalUrl(_ call: CAPPluginCall) {
        guard let text = call.getString("url"), let url = URL(string: text),
              url.scheme == "https", url.host == "github.com",
              url.path.hasPrefix("/arabicwithabdelmalek-cpu/mawaeidi/releases/") else {
            call.reject("رابط غير موثوق.", "untrusted_update_url")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened { call.resolve(["opened": true]) }
                else { call.reject("تعذّر فتح الرابط.") }
            }
        }
    }
}
