mod error;
mod request;
mod response;

use aws_sdk_s3::operation::list_objects_v2::ListObjectsV2Output;
use aws_sdk_s3::types::{CommonPrefix, Object};
use axum::extract::{Path as Uri, Query};
use axum::http::Request;
use axum::response::Response;
use axum::routing::{any, get};
use futures::prelude::*;
use std::path::{Component, Path, PathBuf};
use tokio::fs::read_dir;
use tower::util::Ready;
use tower::{Service, ServiceExt};
use tower_http::services::fs::{ServeDir, ServeFileSystemResponseBody};

use error::{Error, ErrorCode, Result};
use request::ListBucketRequest;
use response::ListBucketResult;

trait IntoOption {
    fn into_option(self) -> Option<Self>
    where
        Self: Sized;
}

impl<T> IntoOption for Vec<T> {
    fn into_option(self) -> Option<Self> {
        if self.is_empty() {
            None
        } else {
            Some(self)
        }
    }
}

const BUCKET_NAME: &str = "contents";

pub fn router<S>(root: PathBuf) -> axum::Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    let serve_dir = ServeDir::new(&root);
    let handler = get(move |p, q| list_bucket(root, p, q));
    axum::Router::new()
        .route("/:bucket", handler.clone())
        .route("/:bucket/", handler)
        .route(
            "/:bucket/*key",
            any(move |p, r| get_object(serve_dir, p, r)),
        )
}

async fn list_bucket(
    root: PathBuf,
    Uri(bucket): Uri<String>,
    Query(ListBucketRequest(request)): Query<ListBucketRequest>,
) -> Result<ListBucketResult> {
    if bucket != BUCKET_NAME {
        return Err(Error::from(ErrorCode::NoSuchBucket).bucket_name(bucket));
    }

    let prefix = request.prefix().unwrap_or_default();
    let path = Path::new(prefix);
    if !path.components().all(|c| matches!(c, Component::Normal(_))) {
        return Err(Error::from(ErrorCode::InvalidArgument)
            .message("The specified argument was not valid."));
    }
    let path = root.join(path);

    let mut entries = read_dir(&path).await?;
    let mut contents = Vec::new();
    let mut common_prefixes = Vec::new();
    while let Some(entry) = entries.next_entry().await? {
        let metadata = entry.metadata().await?;
        let key = entry
            .path()
            .strip_prefix(&root)
            .map_err(|e| Error::from(ErrorCode::InternalError).message(e.to_string()))?
            .to_str()
            .unwrap()
            .to_string();

        if metadata.is_file() {
            contents.push(
                Object::builder()
                    .key(key)
                    .last_modified(metadata.modified()?.into())
                    .size(metadata.len() as _)
                    .build(),
            );
        } else if metadata.is_dir() {
            common_prefixes.push(CommonPrefix::builder().prefix(format!("{key}/")).build());
        }
    }

    contents.sort_by(|a, b| a.key().cmp(&b.key()));
    common_prefixes.sort_by(|a, b| a.prefix().cmp(&b.prefix()));

    Ok(ListObjectsV2Output::builder()
        .name(BUCKET_NAME)
        .prefix(prefix)
        .delimiter("/")
        .key_count(contents.len() as _)
        .set_contents(contents.into_option())
        .set_common_prefixes(common_prefixes.into_option())
        .build()
        .into())
}

async fn get_object<B>(
    mut serve_dir: ServeDir,
    Uri((bucket, key)): Uri<(String, String)>,
    mut request: Request<B>,
) -> Result<Response<ServeFileSystemResponseBody>>
where
    B: axum::body::HttpBody + Send + 'static,
{
    if bucket != BUCKET_NAME {
        return Err(Error::from(ErrorCode::NoSuchBucket).bucket_name(bucket));
    }

    let uri = request.uri();
    let mut builder = axum::http::uri::Builder::new();
    if let Some(scheme) = uri.scheme() {
        builder = builder.scheme(scheme.as_str());
    }
    if let Some(authority) = uri.authority() {
        builder = builder.authority(authority.as_str());
    }
    if let Some(paq) = uri.path_and_query() {
        let paq = paq.as_str()[1..]
            .strip_prefix(BUCKET_NAME)
            .unwrap_or_default();
        builder = builder.path_and_query(paq);
    }

    *request.uri_mut() = builder
        .build()
        .map_err(|e| Error::from(ErrorCode::InternalError).message(e.to_string()))?;

    let ready: Ready<_, Request<B>> = serve_dir.ready();
    ready
        .and_then(|s| s.call(request))
        .err_into()
        .map_err(|e: Error| e.key(key))
        .await
}
