# titime - Tool for Instant Time Tracking

![Logo](./assets/source/icon.png)

`titime` is the very basic and simple to use tool for tracking your time

## Prerequisites

- Linux/MacOS/Windows
- `npm install electron-forge -g` (for development only)
- `apt-get install libxss-dev pkg-config` (Linux only)

## Installation

Download prebuild application from [release page](https://github.com/AlexanderC/titime/releases/latest).

## Development

```bash
npm install
npm run start
```

Create distribution:

```bash
npm run make
```

Publish to GitHub:

```bash
npm run publish
```

## Roadmap

- [x] Add iddle detection
- [x] Add icon
- [x] Add Redmine Integration
- [x] Add deep Redmine Integration
- [x] Archive old data
- [x] Add Jira Integration
- [ ] Add deep Jira Integration
- [ ] Build for multiple platforms (Linux/Win)
- [ ] Add tests
- [ ] Add import/export of data
- [ ] Add Cloud synchronization
- [ ] Add support for mobile devices
