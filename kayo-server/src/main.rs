mod api;
pub(crate) mod ser_xml;

use anyhow::Result;
use axum::routing::any_service;
use clap::Parser;
use std::path::PathBuf;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tracing::{debug, error, info};

fn main() -> Result<()> {
    use tracing_subscriber::prelude::*;

    let args = Args::parse();

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(tracing_subscriber::filter::LevelFilter::INFO.into())
                .from_env()
                .unwrap(),
        )
        .init();

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async_main(args))
}

#[cfg(unix)]
async fn receive_signal() {
    use tokio::signal::unix::*;

    let mut interrupt = match signal(SignalKind::interrupt()) {
        Ok(s) => s,
        Err(e) => {
            error!("failed to install SIGINT handler: {e}");
            return;
        }
    };
    let mut terminate = match signal(SignalKind::terminate()) {
        Ok(s) => s,
        Err(e) => {
            error!("failed to install SIGTERM handler: {e}");
            return;
        }
    };

    tokio::select! {
        _ = interrupt.recv() => debug!("caught SIGINT"),
        _ = terminate.recv() => debug!("caught SIGTERM"),
    }
}

#[cfg(windows)]
async fn receive_signal() {
    use tokio::signal::windows::*;

    let mut ctrl_c = match ctrl_c() {
        Ok(s) => s,
        Err(e) => {
            error!("failed to install Ctrl+C handler: {e}");
            return;
        }
    };
    let mut ctrl_break = match ctrl_break() {
        Ok(s) => s,
        Err(e) => {
            error!("failed to install Ctrl+Break handler: {e}");
            return;
        }
    };

    tokio::select! {
        _ = ctrl_c.recv() => debug!("caught Ctrl+C"),
        _ = ctrl_break.recv() => debug!("caught Ctrl+Break"),
    }
}

#[cfg(not(any(unix, windows)))]
async fn receive_signal() {
    if let Err(e) = tokio::signal::ctrl_c().await {
        error!("failed to receive signal: {e}");
    }
}

#[derive(Parser)]
#[command(about, version)]
struct Args {
    /// Bind to the specified ADDRESS and PORT.
    #[arg(
        short,
        long,
        value_name = "ADDRESS:PORT",
        default_value = "0.0.0.0:3000"
    )]
    bind: String,

    /// Specify path to the directory where media contents are stored.
    #[arg(short, long, value_name = "PATH", default_value = "contents")]
    contents_root: PathBuf,

    /// Specify path to the directory where player contents are stored.
    #[arg(short, long, value_name = "PATH", default_value = ".")]
    player_root: PathBuf,

    /// Enable CORS.
    #[arg(long)]
    cors: bool,
}

async fn async_main(args: Args) -> Result<()> {
    let mut app = axum::Router::new()
        .nest("/api", api::router(args.contents_root))
        .nest_service("/", any_service(ServeDir::new(&args.player_root)));
    if args.cors {
        app = app.layer(CorsLayer::permissive());
    }

    let listener = TcpListener::bind(&args.bind).await?;
    if let Ok(addr) = listener.local_addr() {
        info!("server started on {}", addr);
    } else {
        info!("server started");
    }

    axum::serve(listener, app)
        .with_graceful_shutdown(receive_signal())
        .await?;
    Ok(())
}
