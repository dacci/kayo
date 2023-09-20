use aws_sdk_s3::operation::list_objects_v2::ListObjectsV2Input;
use serde::de;
use std::fmt;
use std::marker::PhantomData;
use std::str::FromStr;

struct EnumHelper<T>(T);

impl<'de, T> de::Deserialize<'de> for EnumHelper<T>
where
    T: FromStr,
    T::Err: fmt::Display,
{
    fn deserialize<D: de::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct Visitor<T>(PhantomData<fn() -> T>);

        impl<'de, T> de::Visitor<'de> for Visitor<T>
        where
            T: FromStr,
            T::Err: fmt::Display,
        {
            type Value = T;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string")
            }

            fn visit_str<E: de::Error>(self, v: &str) -> Result<Self::Value, E> {
                v.parse::<T>().map_err(de::Error::custom)
            }
        }

        deserializer
            .deserialize_str(Visitor(PhantomData))
            .map(EnumHelper)
    }
}

#[repr(transparent)]
#[derive(Debug)]
pub struct ListBucketRequest(pub ListObjectsV2Input);

impl<'de> de::Deserialize<'de> for ListBucketRequest {
    fn deserialize<D: de::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct Visitor;

        impl<'de> de::Visitor<'de> for Visitor {
            type Value = ListBucketRequest;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a map")
            }

            fn visit_map<A: de::MapAccess<'de>>(self, mut map: A) -> Result<Self::Value, A::Error> {
                enum Field {
                    ListType,
                    Bucket,
                    Delimiter,
                    EncodingType,
                    MaxKeys,
                    Prefix,
                    ContinuationToken,
                    FetchOwner,
                    StartAfter,
                    RequestPayer,
                    ExpectedBucketOwner,
                }

                impl<'de> de::Deserialize<'de> for Field {
                    fn deserialize<D: de::Deserializer<'de>>(
                        deserializer: D,
                    ) -> Result<Self, D::Error> {
                        struct Visitor;

                        impl<'de> de::Visitor<'de> for Visitor {
                            type Value = Field;

                            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                                formatter.write_str("an identifier")
                            }

                            fn visit_str<E: de::Error>(self, v: &str) -> Result<Self::Value, E> {
                                match v {
                                    "list-type" => Ok(Field::ListType),
                                    "bucket" => Ok(Field::Bucket),
                                    "delimiter" => Ok(Field::Delimiter),
                                    "encoding-type" => Ok(Field::EncodingType),
                                    "max-keys" => Ok(Field::MaxKeys),
                                    "prefix" => Ok(Field::Prefix),
                                    "continuation-token" => Ok(Field::ContinuationToken),
                                    "fetch-owner" => Ok(Field::FetchOwner),
                                    "start-after" => Ok(Field::StartAfter),
                                    "request-payer" => Ok(Field::RequestPayer),
                                    "expected-bucket-owner" => Ok(Field::ExpectedBucketOwner),
                                    _ => Err(de::Error::unknown_field(
                                        v,
                                        &[
                                            "list-type",
                                            "bucket",
                                            "delimiter",
                                            "encoding-type",
                                            "max-keys",
                                            "prefix",
                                            "continuation-token",
                                            "fetch-owner",
                                            "start-after",
                                            "request-payer",
                                            "expected-bucket-owner",
                                        ],
                                    )),
                                }
                            }
                        }

                        deserializer.deserialize_identifier(Visitor)
                    }
                }

                let mut builder = ListObjectsV2Input::builder();

                while let Some(field) = map.next_key()? {
                    match field {
                        Field::ListType => {
                            map.next_value::<de::IgnoredAny>()?;
                        }
                        Field::Bucket => builder = builder.bucket(map.next_value::<String>()?),
                        Field::Delimiter => {
                            builder = builder.delimiter(map.next_value::<String>()?)
                        }
                        Field::EncodingType => {
                            builder = builder.encoding_type(map.next_value::<EnumHelper<_>>()?.0)
                        }
                        Field::MaxKeys => builder = builder.max_keys(map.next_value()?),
                        Field::Prefix => builder = builder.prefix(map.next_value::<String>()?),
                        Field::ContinuationToken => {
                            builder = builder.continuation_token(map.next_value::<String>()?)
                        }
                        Field::FetchOwner => builder = builder.fetch_owner(map.next_value()?),
                        Field::StartAfter => {
                            builder = builder.start_after(map.next_value::<String>()?)
                        }
                        Field::RequestPayer => {
                            builder = builder.request_payer(map.next_value::<EnumHelper<_>>()?.0)
                        }
                        Field::ExpectedBucketOwner => {
                            builder = builder.expected_bucket_owner(map.next_value::<String>()?)
                        }
                    }
                }

                builder
                    .build()
                    .map(ListBucketRequest)
                    .map_err(de::Error::custom)
            }
        }

        deserializer.deserialize_map(Visitor)
    }
}
