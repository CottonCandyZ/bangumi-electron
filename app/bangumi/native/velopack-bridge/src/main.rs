use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    io::{self, Read, Write},
    process::ExitCode,
    sync::mpsc,
    thread,
    time::Duration,
};
use velopack::{
    locator::VelopackLocatorConfig, sources::GithubSource, UpdateCheck, UpdateInfo, UpdateManager,
    UpdateOptions,
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

    // Velopack's Node AutoSource currently constructs GithubSource with prerelease=false and
    // does not expose a source option to JavaScript. Calling the Rust SDK directly is the only
    // difference in this bridge; update selection, delta reconstruction, verification and full
    // package fallback all continue to use Velopack's own UpdateManager implementation.
    let source = GithubSource::new(&request.source_url, None, request.prerelease);
    let manager = UpdateManager::new(source, Some(request.options), Some(request.locator))?;

    match request.command {
        BridgeCommand::Check => check_for_updates(&manager),
        BridgeCommand::Download => {
            let update = request
                .update
                .ok_or("download requires an update payload")?;
            download_update(manager, update)
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

fn download_update(
    manager: UpdateManager,
    update: UpdateInfo,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (progress_sender, progress_receiver) = mpsc::channel();

    // Downloading is synchronous in the Rust SDK. Run it on a worker thread so the main thread
    // can forward progress events to Electron while Velopack downloads and reconstructs deltas.
    let worker = thread::spawn(move || manager.download_updates(&update, Some(progress_sender)));

    while !worker.is_finished() {
        match progress_receiver.recv_timeout(Duration::from_millis(100)) {
            Ok(percent) => emit(json!({ "event": "progress", "percent": percent }))?,
            Err(mpsc::RecvTimeoutError::Timeout) => {}
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }

    // Flush progress values queued immediately before the worker exited.
    for percent in progress_receiver.try_iter() {
        emit(json!({ "event": "progress", "percent": percent }))?;
    }

    worker
        .join()
        .map_err(|_| "Velopack download worker panicked")??;
    emit(json!({ "event": "result" }))?;
    Ok(())
}

fn emit(value: Value) -> io::Result<()> {
    let stdout = io::stdout();
    let mut output = stdout.lock();
    serde_json::to_writer(&mut output, &value)?;
    output.write_all(b"\n")?;
    output.flush()
}
