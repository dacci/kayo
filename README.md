# Kayo Media Server

## How to build

```console
$ docker build -t kayo .
```

## Usage

Start container and access with your browser.

```console
$ docker run -it --rm -v /path/to/contents:/kayo/contents -p 80:3000 kayo
```
