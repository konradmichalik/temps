//! Lightweight refresh scheduler.
//!
//! Unlike beacon (whose Rust layer fetches and diffs GitHub/GitLab), temps
//! keeps all weather logic in the TypeScript services — they are pure, tested,
//! and shared with the web/landing builds. The Rust side only needs to provide
//! a reliable heartbeat so the popover refreshes (and the rain-alert can fire)
//! even while it is hidden. On each tick we emit a `refresh` event; the webview
//! listens and calls `weather.load(force)`.

use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// Polling state. `interval_secs == 0` means polling is paused.
#[derive(Default)]
pub struct Poller {
    interval_secs: AtomicU64,
}

impl Poller {
    pub fn new() -> Self {
        Self::default()
    }
}

/// Spawn the single background heartbeat thread. Started once from `setup`.
pub fn spawn(app: AppHandle) {
    std::thread::spawn(move || loop {
        let secs = app.state::<Poller>().interval_secs.load(Ordering::Acquire);
        if secs == 0 {
            // Paused — idle cheaply until re-enabled.
            std::thread::sleep(Duration::from_secs(5));
            continue;
        }
        std::thread::sleep(Duration::from_secs(secs));
        // Re-check: the interval may have been paused while we slept.
        if app.state::<Poller>().interval_secs.load(Ordering::Acquire) != 0 {
            let _ = app.emit("refresh", ());
        }
    });
}

/// Start (or reconfigure) polling at the given interval. Called by the frontend
/// on init and whenever the polling-interval setting changes.
#[tauri::command]
pub fn start_polling(app: AppHandle, interval_minutes: u64) -> Result<(), String> {
    let secs = interval_minutes.clamp(1, 180) * 60;
    app.state::<Poller>()
        .interval_secs
        .store(secs, Ordering::Release);
    Ok(())
}

/// Pause polling.
#[tauri::command]
pub fn stop_polling(app: AppHandle) -> Result<(), String> {
    app.state::<Poller>()
        .interval_secs
        .store(0, Ordering::Release);
    Ok(())
}

/// Fire an immediate refresh (manual reload from a shortcut or the tray menu).
#[tauri::command]
pub fn trigger_poll(app: AppHandle) -> Result<(), String> {
    app.emit("refresh", ()).map_err(|e| e.to_string())
}
