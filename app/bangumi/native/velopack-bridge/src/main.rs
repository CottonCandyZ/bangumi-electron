use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    io::{self, Read, Write},
    path::{Path, PathBuf},
    process::ExitCode,
    sync::{mpsc, Arc, Mutex},
    thread,
    time::Duration,
};
use velopack::{
    locator::VelopackLocatorConfig,
    sources::{GithubSource, UpdateSource},
    UpdateCheck, UpdateInfo, UpdateManager, UpdateOptions,
};

/// Commands intentionally stay small: applying an update remains the responsibility of the
/// official JavaScript package, which already starts the platform-specific Velopack updater.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BridgeRequest {
    command: BridgeCommand,
    source_url: String,
    prerelease: bool,
    options: UpdateOptions,
    locator: VelopackLocatorConfig,
    update: Option<UpdateInfo>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
enum BridgeCommand {
    Check,
    Download,
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            // Errors go to stderr so stdout remains a machine-readable NDJSON event stream.
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input)?;
    let request: BridgeRequest = serde_json::from_str(&input)?;
    let packages_dir = request.locator.PackagesDir.clone();

    // Velopack's Node AutoSource currently constructs GithubSource with prerelease=false and
    // does not expose a source option to JavaScript. Calling the Rust SDK directly is the only
    // difference in this bridge; update selection, delta reconstruction, verification and full
    // package fallback all continue to use Velopack's own UpdateManager implementation.
    let source = GithubSource::new(&request.source_url, None, request.prerelease);
    let activity = Arc::new(Mutex::new(Activity::default()));
    let source = ReportingSource {
        inner: source,
        activity: activity.clone(),
        deltas: request
            .update
            .as_ref()
            .map(|u| {
                u.DeltasToTarget
                    .iter()
                    .map(|a| a.FileName.clone())
                    .collect()
            })
            .unwrap_or_default(),
    };
    let manager = UpdateManager::new(source, Some(request.options), Some(request.locator))?;

    match request.command {
        BridgeCommand::Check => check_for_updates(&manager),
        BridgeCommand::Download => {
            let update = request
                .update
                .ok_or("download requires an update payload")?;
            download_update(manager, update, &packages_dir, activity)
        }
    }
}

fn check_for_updates(
    manager: &UpdateManager,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let update = match manager.check_for_updates()? {
        UpdateCheck::UpdateAvailable(update) => Some(*update),
        UpdateCheck::RemoteIsEmpty | UpdateCheck::NoUpdateAvailable => None,
    };

    emit(json!({ "event": "result", "update": update }))?;
    Ok(())
}

#[derive(Default)]
struct Activity {
    phase: &'static str,
    path: PathBuf,
    total: u64,
    index: Option<usize>,
    count: usize,
    fallback: bool,
    completed_deltas: Vec<PathBuf>,
}

impl Activity {
    fn snapshot(&self) -> Value {
        let reconstructing = self.phase == "verify"
            && self.index == Some(self.count)
            && self.completed_deltas.iter().all(|p| p.exists());
        let phase = if reconstructing {
            "reconstruct"
        } else {
            self.phase
        };
        json!({
            "phase": if phase.is_empty() { "prepare" } else { phase },
            "fileName": self.path.file_name().map(|p| p.to_string_lossy()),
            "filePath": self.path,
            "bytes": file_size(&self.path).unwrap_or(0).min(self.total),
            "totalBytes": self.total,
            "index": self.index,
            "count": self.count,
            "fallback": self.fallback,
        })
    }
}

struct ReportingSource<S> {
    inner: S,
    activity: Arc<Mutex<Activity>>,
    deltas: Vec<String>,
}

impl<S: UpdateSource> UpdateSource for ReportingSource<S> {
    fn get_release_feed(
        &self,
        channel: &str,
        app: &velopack::bundle::Manifest,
        staged_user_id: &str,
    ) -> Result<velopack::VelopackAssetFeed, velopack::Error> {
        self.inner.get_release_feed(channel, app, staged_user_id)
    }

    fn download_release_entry(
        &self,
        asset: &velopack::VelopackAsset,
        local_file: &Path,
        progress: Option<mpsc::Sender<i16>>,
    ) -> Result<(), velopack::Error> {
        let index = self
            .deltas
            .iter()
            .position(|name| name == &asset.FileName)
            .map(|i| i + 1);
        {
            let mut activity = self.activity.lock().unwrap();
            activity.phase = if index.is_some() { "delta" } else { "full" };
            activity.path = local_file.to_owned();
            activity.total = asset.Size;
            activity.index = index;
            activity.count = self.deltas.len();
            activity.fallback = index.is_none() && !self.deltas.is_empty();
            if index.is_some() {
                activity
                    .completed_deltas
                    .push(local_file.with_file_name(&asset.FileName));
            }
            let _ = emit(json!({ "event": "activity", "activity": activity.snapshot() }));
        }
        self.inner
            .download_release_entry(asset, local_file, progress)?;
        let mut activity = self.activity.lock().unwrap();
        activity.phase = "verify";
        let _ = emit(json!({ "event": "activity", "activity": activity.snapshot() }));
        Ok(())
    }
}

fn download_update(
    manager: UpdateManager,
    update: UpdateInfo,
    packages_dir: &Path,
    activity: Arc<Mutex<Activity>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (progress_sender, progress_receiver) = mpsc::channel();
    let delta_progress = DeltaProgressTracker::new(packages_dir, &update);
    let mut reporter = ProgressReporter::default();

    reporter.report(0)?;
    let mut last_activity = Value::Null;

    // Downloading is synchronous in the Rust SDK. Run it on a worker thread so the main thread
    // can forward progress events to Electron while Velopack downloads and reconstructs deltas.
    let worker = thread::spawn(move || manager.download_updates(&update, Some(progress_sender)));

    while !worker.is_finished() {
        let sdk_progress = match progress_receiver.recv_timeout(Duration::from_millis(100)) {
            Ok(percent) => Some(percent),
            Err(mpsc::RecvTimeoutError::Timeout) => None,
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        };

        let mut detail = activity.lock().unwrap().snapshot();
        if detail["phase"] == "reconstruct" {
            if let Some(tracker) = &delta_progress {
                detail["bytes"] = json!(file_size(&tracker.output_partial_path).unwrap_or(0));
                detail["totalBytes"] = json!(tracker.output_size);
                detail["filePath"] = json!(tracker.output_partial_path);
                detail["fileName"] = json!(tracker
                    .output_partial_path
                    .file_name()
                    .map(|p| p.to_string_lossy()));
            }
        }
        if detail != last_activity {
            emit(json!({ "event": "activity", "activity": detail }))?;
            if detail["phase"] != last_activity["phase"] {
                reporter.last_percent = None;
            }
            last_activity = detail;
        }
        let full_download = activity.lock().unwrap().fallback;
        // Velopack 1.1.1 does not forward delta download progress and only emits 0, 70 and 100.
        // Track both the downloaded deltas and the reconstructed full package instead, so the
        // visible progress follows actual bytes written throughout the whole patch operation.
        if full_download {
            if let Some(percent) = sdk_progress {
                reporter.report(percent.min(99))?;
            }
        } else if let Some(delta_progress) = &delta_progress {
            reporter.report(delta_progress.percent())?;
        } else if let Some(percent) = sdk_progress {
            reporter.report(percent)?;
        }
    }

    // Flush progress values queued immediately before the worker exited.
    if let Some(delta_progress) = &delta_progress {
        reporter.report(delta_progress.percent())?;
    } else {
        for percent in progress_receiver.try_iter() {
            reporter.report(percent)?;
        }
    }

    worker
        .join()
        .map_err(|_| "Velopack download worker panicked")??;
    reporter.report(100)?;
    emit(json!({ "event": "result" }))?;
    Ok(())
}

#[derive(Default)]
struct ProgressReporter {
    last_percent: Option<i16>,
}

impl ProgressReporter {
    fn report(&mut self, percent: i16) -> io::Result<()> {
        let percent = percent.clamp(0, 100);
        if self.last_percent.is_some_and(|last| percent <= last) {
            return Ok(());
        }

        self.last_percent = Some(percent);
        emit(json!({ "event": "progress", "percent": percent }))
    }
}

struct DeltaProgressTracker {
    delta_files: Vec<(PathBuf, PathBuf, u64)>,
    delta_total_size: u64,
    output_partial_path: PathBuf,
    output_final_path: PathBuf,
    output_size: u64,
}

impl DeltaProgressTracker {
    fn new(packages_dir: &Path, update: &UpdateInfo) -> Option<Self> {
        if update.BaseRelease.is_none() || update.DeltasToTarget.is_empty() {
            return None;
        }

        let delta_files = update
            .DeltasToTarget
            .iter()
            .map(|delta| {
                let final_path = packages_dir.join(&delta.FileName);
                let partial_path = final_path.with_extension("partial");
                (partial_path, final_path, delta.Size)
            })
            .collect::<Vec<_>>();
        let delta_total_size = delta_files.iter().map(|(_, _, size)| *size).sum();
        let output_final_path = packages_dir.join(&update.TargetFullRelease.FileName);
        let output_partial_path = output_final_path.with_extension("partial");

        Some(Self {
            delta_files,
            delta_total_size,
            output_partial_path,
            output_final_path,
            output_size: update.TargetFullRelease.Size,
        })
    }

    fn percent(&self) -> i16 {
        let reconstructed = file_size(&self.output_final_path)
            .or_else(|| file_size(&self.output_partial_path))
            .unwrap_or(0);
        if reconstructed > 0 {
            return delta_reconstruction_percent(reconstructed, self.output_size);
        }

        let downloaded = self
            .delta_files
            .iter()
            .map(|(partial_path, final_path, expected_size)| {
                file_size(final_path)
                    .or_else(|| file_size(partial_path))
                    .unwrap_or(0)
                    .min(*expected_size)
            })
            .sum::<u64>();

        delta_download_percent(downloaded, self.delta_total_size)
    }
}

fn delta_download_percent(downloaded: u64, total_size: u64) -> i16 {
    if total_size == 0 {
        return 0;
    }

    (((downloaded.min(total_size) as f64 / total_size as f64) * 10.0).floor() as i16).clamp(0, 10)
}

fn delta_reconstruction_percent(reconstructed: u64, total_size: u64) -> i16 {
    if total_size == 0 {
        return 10;
    }

    (10 + ((reconstructed.min(total_size) as f64 / total_size as f64) * 89.0).floor() as i16)
        .clamp(10, 99)
}

fn file_size(path: &Path) -> Option<u64> {
    path.metadata().ok().map(|metadata| metadata.len())
}

#[cfg(test)]
mod tests {
    use super::{delta_download_percent, delta_reconstruction_percent, Activity};

    #[test]
    fn source_reports_real_download_selection_including_full_fallback() {
        use super::*;
        struct Probe(Arc<Mutex<Activity>>);
        impl UpdateSource for Probe {
            fn get_release_feed(
                &self,
                _: &str,
                _: &velopack::bundle::Manifest,
                _: &str,
            ) -> Result<velopack::VelopackAssetFeed, velopack::Error> {
                Ok(Default::default())
            }
            fn download_release_entry(
                &self,
                asset: &velopack::VelopackAsset,
                _: &Path,
                _: Option<mpsc::Sender<i16>>,
            ) -> Result<(), velopack::Error> {
                let activity = self.0.lock().unwrap();
                if asset.FileName == "second-delta.nupkg" {
                    assert_eq!(activity.phase, "delta");
                    assert_eq!(activity.index, Some(2));
                    assert!(!activity.fallback);
                } else {
                    assert_eq!(activity.phase, "full");
                    assert_eq!(activity.index, None);
                    assert!(activity.fallback);
                }
                Ok(())
            }
        }
        let activity = Arc::new(Mutex::new(Activity::default()));
        let source = ReportingSource {
            inner: Probe(activity.clone()),
            activity: activity.clone(),
            deltas: vec!["first-delta.nupkg".into(), "second-delta.nupkg".into()],
        };
        for name in ["second-delta.nupkg", "target-full.nupkg"] {
            let asset = velopack::VelopackAsset {
                FileName: name.into(),
                Size: 100,
                ..Default::default()
            };
            source
                .download_release_entry(&asset, Path::new("test.partial"), None)
                .unwrap();
            assert_eq!(activity.lock().unwrap().phase, "verify");
        }
    }

    #[test]
    fn reports_reconstruction_only_after_all_deltas_are_verified_and_renamed() {
        let root = std::env::temp_dir().join(format!("bangumi-progress-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        let first = root.join("first.nupkg");
        let second = root.join("second.nupkg");
        let mut activity = Activity {
            phase: "verify",
            index: Some(2),
            count: 2,
            completed_deltas: vec![first.clone(), second.clone()],
            ..Default::default()
        };
        std::fs::write(&first, b"first").unwrap();
        assert_eq!(activity.snapshot()["phase"], "verify");
        std::fs::write(&second, b"second").unwrap();
        assert_eq!(activity.snapshot()["phase"], "reconstruct");
        activity.phase = "full";
        activity.index = None;
        activity.fallback = true;
        assert_eq!(activity.snapshot()["phase"], "full");
        assert_eq!(activity.snapshot()["fallback"], true);
        std::fs::remove_file(first).unwrap();
        std::fs::remove_file(second).unwrap();
        std::fs::remove_dir(root).unwrap();
    }

    #[test]
    fn reports_current_partial_bytes_independently_of_overall_percent() {
        let path =
            std::env::temp_dir().join(format!("bangumi-progress-{}.partial", std::process::id()));
        let activity = Activity {
            phase: "delta",
            path: path.clone(),
            total: 10,
            index: Some(1),
            count: 2,
            ..Default::default()
        };
        std::fs::write(&path, b"abc").unwrap();
        assert_eq!(activity.snapshot()["bytes"], 3);
        std::fs::write(&path, b"abcdef").unwrap();
        assert_eq!(activity.snapshot()["bytes"], 6);
        assert_eq!(activity.snapshot()["index"], 1);
        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn maps_delta_download_bytes_to_first_ten_percent() {
        assert_eq!(delta_download_percent(0, 100), 0);
        assert_eq!(delta_download_percent(25, 100), 2);
        assert_eq!(delta_download_percent(50, 100), 5);
        assert_eq!(delta_download_percent(100, 100), 10);
        assert_eq!(delta_download_percent(150, 100), 10);
        assert_eq!(delta_download_percent(0, 0), 0);
    }

    #[test]
    fn maps_reconstructed_package_bytes_to_remaining_progress() {
        assert_eq!(delta_reconstruction_percent(0, 100), 10);
        assert_eq!(delta_reconstruction_percent(25, 100), 32);
        assert_eq!(delta_reconstruction_percent(50, 100), 54);
        assert_eq!(delta_reconstruction_percent(100, 100), 99);
        assert_eq!(delta_reconstruction_percent(150, 100), 99);
        assert_eq!(delta_reconstruction_percent(0, 0), 10);
    }
}

fn emit(value: Value) -> io::Result<()> {
    let stdout = io::stdout();
    let mut output = stdout.lock();
    serde_json::to_writer(&mut output, &value)?;
    output.write_all(b"\n")?;
    output.flush()
}
