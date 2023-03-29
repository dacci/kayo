use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use serde::Serialize;
use std::io::ErrorKind;

use crate::ser_xml;

#[derive(Debug, Copy, Clone, Serialize)]
pub enum ErrorCode {
    AccessDenied,
    InternalError,
    InvalidArgument,
    NoSuchBucket,
    NoSuchKey,
}

impl ErrorCode {
    fn as_message(&self) -> &str {
        match self {
            Self::AccessDenied => "Access Denied",
            Self::InternalError => "An internal error occurred. Try again.",
            Self::NoSuchBucket => "The specified bucket does not exist.",
            Self::NoSuchKey => "The specified key does not exist.",
            _ => "",
        }
    }

    fn to_status_code(self) -> StatusCode {
        match self {
            Self::InvalidArgument => StatusCode::BAD_REQUEST,
            Self::AccessDenied => StatusCode::FORBIDDEN,
            Self::NoSuchBucket | Self::NoSuchKey => StatusCode::NOT_FOUND,
            Self::InternalError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl From<ErrorKind> for ErrorCode {
    fn from(kind: ErrorKind) -> Self {
        match kind {
            ErrorKind::NotFound => Self::NoSuchKey,
            ErrorKind::PermissionDenied => Self::AccessDenied,
            _ => Self::InternalError,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct Error {
    code: ErrorCode,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    bucket_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    key: Option<String>,
}

impl Error {
    pub fn from(code: ErrorCode) -> Self {
        Self {
            code,
            message: Some(code.as_message().to_string()),
            bucket_name: None,
            key: None,
        }
    }

    pub fn message(mut self, message: impl Into<String>) -> Self {
        self.message = Some(message.into());
        self
    }

    pub fn bucket_name(mut self, bucket_name: String) -> Self {
        self.bucket_name = Some(bucket_name);
        self
    }

    pub fn key(mut self, key: String) -> Self {
        self.key = Some(key);
        self
    }
}

impl From<std::io::Error> for Error {
    fn from(source: std::io::Error) -> Self {
        Error::from(source.kind().into()).message(source.to_string())
    }
}

impl From<std::convert::Infallible> for Error {
    fn from(_: std::convert::Infallible) -> Self {
        unimplemented!()
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match ser_xml::to_bytes(&self) {
            Ok(body) => (
                self.code.to_status_code(),
                [(header::CONTENT_TYPE, "application/xml")],
                body,
            )
                .into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        }
    }
}

pub type Result<T, E = Error> = std::result::Result<T, E>;
