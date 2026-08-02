//! One-shot current location via CoreLocation (macOS).
//!
//! The Tauri geolocation plugin is mobile-only, so we drive `CLLocationManager`
//! directly through objc2. A delegate captures the first fix (or error) and
//! sends it back over a channel; the manager must live on the main thread with
//! a run loop, so we start it via `run_on_main_thread` and keep it alive in a
//! thread-local until the callback fires.
//!
//! Requires `NSLocationUsageDescription` in Info.plist, and reliably prompts /
//! resolves only in a signed build — unsigned dev builds may be denied silently.

use std::cell::RefCell;
use std::sync::mpsc::Sender;
use std::sync::Mutex;
use std::time::Duration;

use objc2::rc::Retained;
use objc2::runtime::{NSObject, NSObjectProtocol, ProtocolObject};
use objc2::{define_class, msg_send, AllocAnyThread, DefinedClass};
use objc2_core_location::{
    CLAuthorizationStatus, CLLocation, CLLocationManager, CLLocationManagerDelegate,
};
use objc2_foundation::{NSArray, NSError};
use tauri::AppHandle;

type LocResult = Result<(f64, f64), String>;

pub struct DelegateIvars {
    tx: Mutex<Option<Sender<LocResult>>>,
}

define_class!(
    #[unsafe(super = NSObject)]
    #[name = "TempsLocationDelegate"]
    #[ivars = DelegateIvars]
    struct LocationDelegate;

    unsafe impl NSObjectProtocol for LocationDelegate {}

    unsafe impl CLLocationManagerDelegate for LocationDelegate {
        #[unsafe(method(locationManager:didUpdateLocations:))]
        fn did_update(&self, manager: &CLLocationManager, locations: &NSArray<CLLocation>) {
            match locations.lastObject() {
                Some(loc) => {
                    let c = unsafe { loc.coordinate() };
                    self.send(Ok((c.latitude, c.longitude)));
                }
                None => self.send(Err("no location".into())),
            }
            unsafe { manager.stopUpdatingLocation() };
        }

        #[unsafe(method(locationManager:didFailWithError:))]
        fn did_fail(&self, _manager: &CLLocationManager, error: &NSError) {
            self.send(Err(error.localizedDescription().to_string()));
        }

        #[unsafe(method(locationManagerDidChangeAuthorization:))]
        fn did_change_auth(&self, manager: &CLLocationManager) {
            let status = unsafe { manager.authorizationStatus() };
            match status {
                CLAuthorizationStatus::AuthorizedAlways
                | CLAuthorizationStatus::AuthorizedWhenInUse => {
                    unsafe { manager.requestLocation() };
                }
                CLAuthorizationStatus::Denied | CLAuthorizationStatus::Restricted => {
                    self.send(Err("denied".into()));
                }
                _ => {}
            }
        }
    }
);

impl LocationDelegate {
    fn new(tx: Sender<LocResult>) -> Retained<Self> {
        let this = Self::alloc().set_ivars(DelegateIvars {
            tx: Mutex::new(Some(tx)),
        });
        unsafe { msg_send![super(this), init] }
    }

    fn send(&self, result: LocResult) {
        if let Some(tx) = self.ivars().tx.lock().unwrap().take() {
            let _ = tx.send(result);
        }
    }
}

thread_local! {
    /// Keeps the manager + delegate alive on the main thread until a callback
    /// fires (replaced on the next request).
    static KEEPALIVE: RefCell<Option<(Retained<CLLocationManager>, Retained<LocationDelegate>)>> =
        const { RefCell::new(None) };
}

/// Block until CoreLocation returns a fix, an error, or the timeout elapses.
pub fn request(app: &AppHandle) -> Result<(f64, f64), String> {
    let (tx, rx) = std::sync::mpsc::channel::<LocResult>();
    app.run_on_main_thread(move || start(tx))
        .map_err(|e| e.to_string())?;
    rx.recv_timeout(Duration::from_secs(15))
        .unwrap_or_else(|_| Err("timeout".into()))
}

fn start(tx: Sender<LocResult>) {
    let delegate = LocationDelegate::new(tx);
    let manager = unsafe { CLLocationManager::new() };
    unsafe { manager.setDelegate(Some(ProtocolObject::from_ref(&*delegate))) };

    let status = unsafe { manager.authorizationStatus() };
    KEEPALIVE.with(|k| *k.borrow_mut() = Some((manager.clone(), delegate.clone())));

    match status {
        CLAuthorizationStatus::AuthorizedAlways | CLAuthorizationStatus::AuthorizedWhenInUse => {
            unsafe { manager.requestLocation() };
        }
        CLAuthorizationStatus::Denied | CLAuthorizationStatus::Restricted => {
            delegate.send(Err("denied".into()));
        }
        _ => unsafe { manager.requestWhenInUseAuthorization() },
    }
}
