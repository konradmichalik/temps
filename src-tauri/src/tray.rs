use std::sync::Mutex;
use std::time::Instant;
use tauri::{
    image::Image,
    menu::{ContextMenu, MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, PhysicalPosition,
};

pub const TRAY_ID: &str = "temps-tray";

const TRAY_ICON_BYTES: &[u8] = include_bytes!("../icons/temps-tray@2x.png");

/// Tray icon position + physical size.
type TrayRect = (PhysicalPosition<i32>, (u32, u32));

/// Last known tray icon rect, used to position the popover under the icon.
static LAST_TRAY_RECT: Mutex<Option<TrayRect>> = Mutex::new(None);

/// Timestamp of the last `show_and_focus`, used to suppress auto-hide monitors
/// that fire spuriously right after opening (macOS may briefly report a space
/// change when the panel appears above a fullscreen app).
static LAST_SHOWN_AT: Mutex<Option<Instant>> = Mutex::new(None);

const SHOW_GRACE_MS: u128 = 600;

/// Position the popover centered below the tray icon using the stored rect.
pub fn position_window_at_tray(window: &tauri::WebviewWindow) {
    if let Some((pos, size)) = *LAST_TRAY_RECT.lock().unwrap() {
        let window_width = window.outer_size().map(|s| s.width as i32).unwrap_or(340);
        let icon_center_x = pos.x + (size.0 as i32 / 2);
        let x = icon_center_x - (window_width / 2);
        let y = pos.y + size.1 as i32 + 4;
        let _ = window.set_position(PhysicalPosition::new(x, y));
    }
}

/// True if the panel was shown recently enough to suppress auto-hide.
pub fn is_within_show_grace() -> bool {
    LAST_SHOWN_AT
        .lock()
        .unwrap()
        .is_some_and(|t| t.elapsed().as_millis() < SHOW_GRACE_MS)
}

/// Re-apply the popover window properties that can drift after macOS system
/// events (sleep/wake, display reconfiguration, space changes). With Accessory
/// activation the app is mostly "inactive", so `hidesOnDeactivate` must stay
/// off; the level and collection behavior can be reset by the WindowServer.
///
/// The popover stays tao's own window class. It is not converted to an
/// NSPanel: `object_setClass` onto NSPanel is not allowed for it (tao's class
/// adds an ivar and is KVO-observed), so only NSWindow API is used here.
#[cfg(target_os = "macos")]
fn ensure_panel_config(window: &tauri::WebviewWindow) {
    use objc2::runtime::Sel;
    use objc2_app_kit::{NSPopUpMenuWindowLevel, NSWindow, NSWindowCollectionBehavior};
    if let Ok(ns_window) = window.ns_window() {
        unsafe {
            let panel = &*(ns_window as *const NSWindow);
            panel.setHidesOnDeactivate(false);
            panel.setLevel(NSPopUpMenuWindowLevel);
            panel.setCollectionBehavior(
                NSWindowCollectionBehavior::CanJoinAllSpaces
                    | NSWindowCollectionBehavior::Stationary
                    | NSWindowCollectionBehavior::FullScreenAuxiliary
                    | NSWindowCollectionBehavior::IgnoresCycle,
            );
            // Private API: keeps showing the popover from activating the app.
            // Only sent where the window answers it, never as an unknown selector.
            let prevents = Sel::register(c"_setPreventsActivation:");
            let responds: bool = objc2::msg_send![panel, respondsToSelector: prevents];
            if responds {
                let _: () = objc2::msg_send![panel, _setPreventsActivation: true];
            }
        }
    }
}

/// Public entry point for system-event observers to re-apply panel config.
#[cfg(target_os = "macos")]
pub fn reconfigure_panel(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        ensure_panel_config(&window);
    }
}

/// Show + position the popover. Cycles through `orderOut` first to guarantee a
/// clean WindowServer state (avoids ghost-visible panels), then re-applies panel
/// config and makes the WKWebView first responder so keyboard events reach JS.
fn show_and_focus(window: &tauri::WebviewWindow) {
    *LAST_SHOWN_AT.lock().unwrap() = Some(Instant::now());
    position_window_at_tray(window);

    #[cfg(target_os = "macos")]
    {
        use objc2_app_kit::NSWindow;
        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let panel = &*(ns_window as *const NSWindow);
                let null: *const objc2::runtime::AnyObject = std::ptr::null();
                let _: () = objc2::msg_send![panel, orderOut: null];
            }
        }
        ensure_panel_config(window);
    }

    let _ = window.show();
    let _ = window.set_focus();

    #[cfg(target_os = "macos")]
    if let Ok(ns_window) = window.ns_window() {
        use objc2_app_kit::NSWindow;
        unsafe {
            let panel = &*(ns_window as *const NSWindow);
            panel.orderFrontRegardless();

            // Make the WKWebView (first subview of the content view) the first
            // responder so keyboard events reach JavaScript.
            if let Some(content) = panel.contentView() {
                use objc2::runtime::AnyObject;
                let subviews = content.subviews();
                let target: &AnyObject = if !subviews.is_empty() {
                    let first: *const AnyObject =
                        objc2::msg_send![&*subviews, objectAtIndex: 0usize];
                    &*first
                } else {
                    let ptr: *const AnyObject = &*content as *const _ as *const AnyObject;
                    &*ptr
                };
                let _: bool = objc2::msg_send![panel, makeFirstResponder: target];
            }
        }
    }
}

/// Whether the panel is truly visible and functional (cross-checks AppKit and
/// the window level, since Tauri's `is_visible` can report ghost states).
pub fn is_panel_showing(window: &tauri::WebviewWindow) -> bool {
    if !window.is_visible().unwrap_or(false) {
        return false;
    }

    #[cfg(target_os = "macos")]
    {
        use objc2_app_kit::{NSPopUpMenuWindowLevel, NSWindow};
        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let panel = &*(ns_window as *const NSWindow);
                if !panel.isVisible() {
                    return false;
                }
                if panel.level() < NSPopUpMenuWindowLevel {
                    return false;
                }
            }
        }
    }

    true
}

/// Toggle the popover: hide if visible, show if hidden.
pub fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if is_panel_showing(&window) {
            let _ = window.hide();
        } else {
            show_and_focus(&window);
        }
    }
}

/// Show the popover without toggling (used by the tray "Settings" item).
pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        show_and_focus(&window);
    }
}

pub fn create_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let refresh = MenuItemBuilder::with_id("refresh", "Refresh").build(app)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings…").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit Temps").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&refresh)
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    let icon = Image::from_bytes(TRAY_ICON_BYTES).expect("failed to load tray icon");

    let _tray = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .icon_as_template(cfg!(target_os = "macos"))
        // The menu is deliberately not attached to the status item: macOS then
        // opens it on every click, including the left one, and the click never
        // reaches the tray handler. It is popped up on right click instead.
        .show_menu_on_left_click(false)
        .tooltip("Temps")
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Right,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = menu.popup(window.as_ref().window());
                }
                return;
            }
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();
                // Store the icon rect before toggling so the popover positions
                // correctly. Guard on is_panel_showing so a stale rect isn't
                // written when the panel is in a ghost-visible state.
                if let Some(window) = app.get_webview_window("main") {
                    if !is_panel_showing(&window) {
                        let scale = window.scale_factor().unwrap_or(1.0);
                        let pos = rect.position.to_physical::<i32>(scale);
                        let size = rect.size.to_physical::<u32>(scale);
                        *LAST_TRAY_RECT.lock().unwrap() = Some((pos, (size.width, size.height)));
                    }
                }
                toggle_main_window(app);
            }
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "refresh" => {
                let _ = app.emit("refresh", ());
            }
            "settings" => {
                show_main_window(app);
                let _ = app.emit("open-settings", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

/// Whiten the glyph into a macOS template image (appearance-adaptive in the
/// menubar). The frontend supplies the current weather glyph as PNG bytes.
#[cfg(target_os = "macos")]
fn create_tray_icon(base_bytes: &[u8]) -> (Vec<u8>, u32, u32) {
    use image::{GenericImageView, RgbaImage};

    let base = image::load_from_memory(base_bytes).expect("failed to decode tray icon");
    let (w, h) = base.dimensions();
    let mut canvas = RgbaImage::from(base.to_rgba8());

    // Every non-transparent pixel becomes white; macOS recolors the template.
    for pixel in canvas.pixels_mut() {
        if pixel.0[3] != 0 {
            pixel.0[0] = 255;
            pixel.0[1] = 255;
            pixel.0[2] = 255;
        }
    }

    (canvas.into_raw(), w, h)
}

/// `(temp_text, icon_key)` last rendered — skip identical updates.
type TrayState = (String, Option<String>);

fn last_tray_state() -> &'static Mutex<Option<TrayState>> {
    static STATE: std::sync::OnceLock<Mutex<Option<TrayState>>> = std::sync::OnceLock::new();
    STATE.get_or_init(|| Mutex::new(None))
}

/// Update the tray from the frontend: the current weather glyph (as a template
/// image) plus the temperature text next to it.
pub fn update_tray_icon(
    app: &AppHandle,
    temp_text: Option<String>,
    icon_png: Option<Vec<u8>>,
    icon_key: Option<String>,
) -> Result<(), String> {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return Ok(());
    };

    let title = temp_text.unwrap_or_default();
    let key = (title.clone(), icon_key);
    if last_tray_state().lock().unwrap().as_ref() == Some(&key) {
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        // The frontend renders the current weather glyph; fall back to the
        // bundled silhouette if it couldn't (unknown code, decode failure).
        let base = icon_png.as_deref().unwrap_or(TRAY_ICON_BYTES);
        let (rgba, w, h) = create_tray_icon(base);
        let icon = Image::new_owned(rgba, w, h);
        // Order matters: Tauri's set_icon hardcodes template=false, so set the
        // template flag last to keep the icon appearance-adaptive.
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
        tray.set_icon_as_template(true).map_err(|e| e.to_string())?;
        tray.set_title(Some(&title)).map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = icon_png;
        tray.set_title(Some(&title)).map_err(|e| e.to_string())?;
    }

    *last_tray_state().lock().unwrap() = Some(key);
    Ok(())
}
