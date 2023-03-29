ARG VARIANT=bullseye

# build kayo-server
FROM rust:slim-${VARIANT} as server

WORKDIR /build
COPY kayo-server .
RUN cargo build --release

# build kayo-player
FROM node:18-${VARIANT}-slim AS player

WORKDIR /build
COPY kayo-player .
RUN yarn install && yarn build

# build final image
FROM debian:${VARIANT}-slim

COPY --from=server /build/target/release/kayo-server /usr/local/bin

RUN useradd -Md /kayo kayo && mkdir /kayo && chown kayo: /kayo
USER kayo
WORKDIR /kayo

RUN mkdir contents
COPY --from=player --chown=kayo /build/build .

EXPOSE 3000

ENTRYPOINT [ "/usr/local/bin/kayo-server" ]
