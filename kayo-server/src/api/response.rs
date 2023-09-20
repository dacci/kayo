use aws_sdk_s3::operation::list_objects_v2::ListObjectsV2Output;
use aws_smithy_types::date_time::Format;
use axum::http::header::CONTENT_TYPE;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::ser::{self, Serialize, SerializeStruct, Serializer};

use crate::ser_xml;

#[repr(transparent)]
pub struct ListBucketResult(pub ListObjectsV2Output);

impl From<ListObjectsV2Output> for ListBucketResult {
    fn from(inner: ListObjectsV2Output) -> Self {
        Self(inner)
    }
}

impl Serialize for ListBucketResult {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut s = serializer.serialize_struct("ListBucketResult", 0)?;

        s.serialize_field("IsTruncated", &self.0.is_truncated())?;

        if let Some(contents) = self.0.contents() {
            let contents = contents.iter().map(Contents).collect::<Vec<_>>();
            s.serialize_field("", &contents)?;
        }

        if let Some(name) = self.0.name() {
            s.serialize_field("Name", name)?;
        }

        if let Some(prefix) = self.0.prefix() {
            s.serialize_field("Prefix", prefix)?;
        }

        if let Some(delimiter) = self.0.delimiter() {
            s.serialize_field("Delimiter", delimiter)?;
        }

        s.serialize_field("MaxKeys", &self.0.max_keys())?;

        if let Some(common_prefixes) = self.0.common_prefixes() {
            let common_prefixes = common_prefixes
                .iter()
                .map(CommonPrefixes)
                .collect::<Vec<_>>();
            s.serialize_field("", &common_prefixes)?;
        }

        if let Some(encoding_type) = self.0.encoding_type() {
            s.serialize_field("EncodingType", encoding_type.as_str())?;
        }

        s.serialize_field("KeyCount", &self.0.key_count())?;

        if let Some(continuation_token) = self.0.continuation_token() {
            s.serialize_field("ContinuationToken", continuation_token)?;
        }

        if let Some(next_continuation_token) = self.0.next_continuation_token() {
            s.serialize_field("NextContinuationToken", next_continuation_token)?;
        }

        if let Some(start_after) = self.0.start_after() {
            s.serialize_field("StartAfter", start_after)?;
        }

        s.end()
    }
}

impl IntoResponse for ListBucketResult {
    fn into_response(self) -> Response {
        match ser_xml::to_bytes(&self) {
            Ok(body) => (StatusCode::OK, [(CONTENT_TYPE, "application/xml")], body).into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        }
    }
}

#[repr(transparent)]
struct Contents<'a>(&'a aws_sdk_s3::types::Object);

impl Serialize for Contents<'_> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut s = serializer.serialize_struct("Contents", 0)?;

        if let Some(key) = self.0.key() {
            s.serialize_field("Key", key)?;
        }

        if let Some(last_modified) = self.0.last_modified() {
            let last_modified = last_modified
                .fmt(Format::DateTime)
                .map_err(ser::Error::custom)?;
            s.serialize_field("LastModified", &last_modified)?;
        }

        if let Some(e_tag) = self.0.e_tag() {
            s.serialize_field("ETag", e_tag)?;
        }

        if let Some(checksum_algorithms) = self.0.checksum_algorithm() {
            checksum_algorithms
                .iter()
                .try_for_each(|a| s.serialize_field("ChecksumAlgorithm", a.as_str()))?;
        }

        s.serialize_field("Size", &self.0.size())?;

        if let Some(storage_class) = self.0.storage_class() {
            s.serialize_field("StorageClass", storage_class.as_str())?;
        }

        if let Some(owner) = self.0.owner() {
            s.serialize_field("", &Owner(owner))?;
        }

        s.end()
    }
}

#[repr(transparent)]
struct CommonPrefixes<'a>(&'a aws_sdk_s3::types::CommonPrefix);

impl Serialize for CommonPrefixes<'_> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut s = serializer.serialize_struct("CommonPrefixes", 0)?;

        if let Some(prefix) = self.0.prefix() {
            s.serialize_field("Prefix", prefix)?;
        }

        s.end()
    }
}

#[repr(transparent)]
struct Owner<'a>(&'a aws_sdk_s3::types::Owner);

impl Serialize for Owner<'_> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut s = serializer.serialize_struct("Owner", 0)?;

        if let Some(display_name) = self.0.display_name() {
            s.serialize_field("DisplayName", display_name)?;
        }

        if let Some(id) = self.0.id() {
            s.serialize_field("ID", id)?;
        }

        s.end()
    }
}
