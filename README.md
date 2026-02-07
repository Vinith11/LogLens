# LogLens

LogLens is a lightweight developer tool that provides a web UI for managing containers, viewing logs, and checking runtime statistics. It connects to your local container runtime and exposes a dashboard through a browser.

---

## Features

* View running containers
* Start and stop containers
* View container logs
* Monitor container stats
* Browse images and volumes
* Simple web dashboard

---

---

## Prerequisites

Before running LogLens, ensure the following are installed:

### 1. Go

* Version: **1.20 or newer**
* Verify installation:

```
go version
```

Download: [https://go.dev/dl/](https://go.dev/dl/)

---

### 2. Docker

LogLens interacts with containers, so Docker must be installed and running.

Verify installation:

```
docker version
```

Download: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

---

### 3. Git (optional but recommended)

```
git --version
```

---

## Installation / Setup

Clone the repository:

```
git clone https://github.com/Vinith11/LogLens
cd loglens
```

Install dependencies:

```
go mod tidy
```

---

## Running the Application

Start the server:

```
go run main.go
```

By default the server runs at:

```
http://localhost:8080
```

Open this in your browser to access the dashboard.

---

## Building the Application

You can build a binary for your OS.

### Linux / macOS

```
go build -o loglens
./loglens
```

### Windows

```
go build -o loglens.exe
loglens.exe
```

---

## Cross-Platform Builds (Optional)

Build for Linux from any system:

```
GOOS=linux GOARCH=amd64 go build -o loglens
```

Build for Windows:

```
GOOS=windows GOARCH=amd64 go build -o loglens.exe
```

---

## API Endpoints

### Containers

* `GET /containers` — List all containers
* `GET /container/:id` — Get container details
* `GET /container-start/:id` — Start container
* `GET /container-stop/:id` — Stop container
* `GET /container-stats/:id` — Container statistics
* `GET /container-logs/:id` — Container logs

### Other Resources

* `GET /images` — List images
* `GET /volumes` — List volumes
* `GET /docker-compose` — Compose details
* `GET /dashboard` — Dashboard data

---

## UI Routes

The frontend pages are served from:

* `/` — Dashboard
* `/static/pages/containers.html`
* `/static/pages/images.html`
* `/static/pages/volumes.html`
* `/static/pages/settings.html`

---