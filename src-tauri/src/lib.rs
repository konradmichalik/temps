mod polling;
mod tray;

use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// Default global toggle shortcut. The original temps used Cmd+Shift+W; the
/// frontend can change it via `set_global_shortcut` from the settings screen.
const DEFAULT_GLOBAL_SHORTCUT: &str = "CmdOrCtrl+Shift+W";

/// The currently-registered global shortcut, so it can be replaced/cleared.
fn current_shortcut() -> &'static Mutex<Option<String>> {
    static S: std::sync::OnceLock<Mutex<Option<String>>> = std::sync::OnceLock::new();
    S.get_or_init(|| Mutex::new(None))
}

/// Custom NSPanel subclass that accepts keyboard input and suppresses NSBeep.
///
/// A default NSPanel needs a title/resize bar to become key window; our frameless
/// tray popover has neither, so we override `canBecomeKeyWindow` to return true.
/// `noResponderFor:` is overridden to suppress the system beep for unhandled keys.
#[cfg(target_os = "macos")]
mod panel {
    use objc2::define_class;
    use objc2::runtime::NSObjectProtocol;
    use objc2_app_kit::NSPanel;

    pub struct TempsPanelIvars;

    define_class!(
        #[unsafe(super = NSPanel)]
        #[name = "TempsPanel"]
        #[ivars = TempsPanelIvars]
        pub struct TempsPanel;

        unsafe impl NSObjectProtocol for TempsPanel {}

        impl TempsPanel {
            #[unsafe(method(canBecomeKeyWindow))]
            fn can_become_key_window(&self) -> bool {
                true
            }

            #[unsafe(method(noResponderFor:))]
            fn no_responder_for(&self, _selector: objc2::runtime::Sel) {
                // Intentionally empty — prevents NSBeep() for unhandled key events.
            }
        }
    );
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

/// Push the current temperature color / text to the tray (color indicator +
/// optional menubar temperature text). Called by the frontend when the weather
/// or the relevant settings change.
#[tauri::command]
fn update_tray(
    app: AppHandle,
    rgb: [u8; 3],
    show_dot: bool,
    temp_text: Option<String>,
) -> Result<(), String> {
    tray::update_tray_icon(&app, rgb, show_dot, temp_text)
}

/// Register (or replace) the global toggle shortcut.
#[tauri::command]
fn set_global_shortcut(app: AppHandle, accelerator: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    let gs = app.global_shortcut();
    if let Some(prev) = current_shortcut().lock().unwrap().take() {
        let _ = gs.unregister(prev.as_str());
    }
    gs.register(accelerator.as_str())
        .map_err(|e| e.to_string())?;
    *current_shortcut().lock().unwrap() = Some(accelerator);
    Ok(())
}

/// Remove the global toggle shortcut.
#[tauri::command]
fn clear_global_shortcut(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    if let Some(prev) = current_shortcut().lock().unwrap().take() {
        app.global_shortcut()
            .unregister(prev.as_str())
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        tray::toggle_main_window(app);
                    }
                })
                .build(),
        );

    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        None,
    ));

    builder
        .setup(|app| {
            std::panic::set_hook(Box::new(|info| {
                eprintln!("[temps] PANIC: {info}");
            }));

            app.manage(polling::Poller::new());
            tray::create_tray(app)?;
            polling::spawn(app.handle().clone());

            // Register the default global shortcut; the frontend may replace or
            // clear it on init based on the user's setting.
            {
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                if app
                    .global_shortcut()
                    .register(DEFAULT_GLOBAL_SHORTCUT)
                    .is_ok()
                {
                    *current_shortcut().lock().unwrap() = Some(DEFAULT_GLOBAL_SHORTCUT.to_string());
                } else {
                    eprintln!("[temps] failed to register default global shortcut");
                }
            }

            #[cfg(target_os = "macos")]
            setup_macos(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            quit_app,
            update_tray,
            set_global_shortcut,
            clear_global_shortcut,
            polling::start_polling,
            polling::stop_polling,
            polling::trigger_poll,
        ])
        .run(tauri::generate_context!())
        .expect("error while running temps");
}

/// Native macOS setup: convert the window to an NSPanel and install the
/// auto-hide / panel-drift observers. All NSPanel mutation happens on the main
/// thread (setup runs there; the health-check dispatches back to main).
#[cfg(target_os = "macos")]
fn setup_macos(app: &mut tauri::App) {
    use objc2::runtime::{AnyClass, AnyObject};

    // No dock icon — this is a menubar app.
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    // Convert NSWindow → TempsPanel so the popover floats above fullscreen apps
    // and can accept keyboard input.
    if let Ok(ns_window) = window.ns_window() {
        use objc2::ClassType;
        use objc2_app_kit::{NSPanel, NSWindowStyleMask};
        unsafe {
            let obj = &*(ns_window as *const AnyObject);
            AnyObject::set_class(obj, panel::TempsPanel::class());

            let panel = &*(ns_window as *const NSPanel);
            let mut mask = panel.styleMask();
            mask |= NSWindowStyleMask::NonactivatingPanel;
            panel.setStyleMask(mask);
            panel.setBecomesKeyOnlyIfNeeded(false);
        }
    }

    tray::reconfigure_panel(app.handle());

    // Auto-hide on click outside the panel (global mouse-down monitor).
    let click_handle = app.handle().clone();
    let click_block = block2::RcBlock::new(move |_: std::ptr::NonNull<AnyObject>| {
        if let Some(w) = click_handle.get_webview_window("main") {
            if tray::is_panel_showing(&w) {
                let _ = w.hide();
            }
        }
    });
    unsafe {
        // NSEventMask: LeftMouseDown (1<<1) | RightMouseDown (1<<3).
        let mask: u64 = (1 << 1) | (1 << 3);
        let _: *const AnyObject = objc2::msg_send![
            AnyClass::get(c"NSEvent").unwrap(),
            addGlobalMonitorForEventsMatchingMask: mask,
            handler: &*click_block
        ];
    }

    // Auto-hide on space/desktop change (grace-period guarded).
    let space_handle = app.handle().clone();
    let space_block = block2::RcBlock::new(move |_: std::ptr::NonNull<AnyObject>| {
        if tray::is_within_show_grace() {
            return;
        }
        if let Some(w) = space_handle.get_webview_window("main") {
            if tray::is_panel_showing(&w) {
                let _ = w.hide();
            }
        }
    });
    unsafe {
        let workspace: *const AnyObject =
            objc2::msg_send![AnyClass::get(c"NSWorkspace").unwrap(), sharedWorkspace];
        let center: *const AnyObject = objc2::msg_send![workspace, notificationCenter];
        let name =
            objc2_foundation::NSString::from_str("NSWorkspaceActiveSpaceDidChangeNotification");
        let null: *const AnyObject = std::ptr::null();
        let _: *const AnyObject = objc2::msg_send![
            center,
            addObserverForName: &*name,
            object: null,
            queue: null,
            usingBlock: &*space_block
        ];
    }

    // Re-apply panel config after sleep/wake and display reconfiguration.
    let make_reconfig_block = |handle: AppHandle| {
        block2::RcBlock::new(move |_: std::ptr::NonNull<AnyObject>| {
            tray::reconfigure_panel(&handle);
        })
    };

    let wake_block = make_reconfig_block(app.handle().clone());
    unsafe {
        let workspace: *const AnyObject =
            objc2::msg_send![AnyClass::get(c"NSWorkspace").unwrap(), sharedWorkspace];
        let center: *const AnyObject = objc2::msg_send![workspace, notificationCenter];
        let name = objc2_foundation::NSString::from_str("NSWorkspaceDidWakeNotification");
        let null: *const AnyObject = std::ptr::null();
        let _: *const AnyObject = objc2::msg_send![
            center,
            addObserverForName: &*name,
            object: null,
            queue: null,
            usingBlock: &*wake_block
        ];
    }

    let screen_block = make_reconfig_block(app.handle().clone());
    unsafe {
        let center: *const AnyObject = objc2::msg_send![
            AnyClass::get(c"NSNotificationCenter").unwrap(),
            defaultCenter
        ];
        let name = objc2_foundation::NSString::from_str(
            "NSApplicationDidChangeScreenParametersNotification",
        );
        let null: *const AnyObject = std::ptr::null();
        let _: *const AnyObject = objc2::msg_send![
            center,
            addObserverForName: &*name,
            object: null,
            queue: null,
            usingBlock: &*screen_block
        ];
    }

    // Periodic health-check: re-apply panel config every 60s to recover from
    // silent WindowServer drift that fires no notification. AppKit is not
    // thread-safe, so the work is dispatched to the main thread.
    let health_handle = app.handle().clone();
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_secs(60));
        let handle = health_handle.clone();
        let _ = health_handle.run_on_main_thread(move || {
            tray::reconfigure_panel(&handle);
        });
    });
}
