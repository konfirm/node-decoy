# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
### Added
### Changed
### Removed


## [2.0.1] - 2023-10-25

### Changed
- updated dependencies


## [2.0.0] - 2023-04-02

### Changed

- *BREAKING* There's no more "default" export, all functions are exported individually, changing the way `import` and/or `require` work
- `commit`, `rollback` and `hasMutations` now take optional keys to narrow down the effect of the function to only those keys
- Ported the library to TypeScript
- updated dependencies


## [1.4.7] - 2020-09-06

### Changed

- updated dependencies


## [1.4.6] - 2020-01-18

### Changed

- updated dependencies


## [1.4.5] - 2019-08-26

### Changed

- updated dependencies


## [1.4.4] - 2019-07-15

### Changed

- updated dependencies


## [1.4.3] - 2019-06-05

### Changed

- updated dependencies


## [1.4.2] - 2019-02-08

### Changed

- updated dependencies


## [1.4.1] - 2018-07-08

### Changed

- updated dependencies


## [1.4.0] - 2018-07-08

### Added

- Added means to leverage Symbol.toPrimitive to be handled correctly on Decoys


## [1.3.2] - 2018-04-17

### Changed

- updated dependencies
- added Node 10 as target


## [1.3.1] - 2018-04-18

### Fixed

- Fixed documentation


## [1.3.0] - 2018-04-18

### Added

- Added option to track only the last mutation per key


## [1.2.0] - 2018-01-18

### Added

- hasMutations method


## [1.1.1] - 2017-12-22

### Changed

- publish less source files
- updated depenencies


## [1.1.0] - 2017-12-11

### Changed

- checksum now uses @konfirm/checksum for a more stable checksum generation


## [1.0.0] - 2017-12-06

Initial release.


[Unreleased]: https://github.com/konfirm/node-decoy/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/konfirm/node-decoy/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/konfirm/node-decoy/compare/v1.4.7...v2.0.0
[1.4.7]: https://github.com/konfirm/node-decoy/compare/v1.4.6...v1.4.7
[1.4.6]: https://github.com/konfirm/node-decoy/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/konfirm/node-decoy/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/konfirm/node-decoy/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/konfirm/node-decoy/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/konfirm/node-decoy/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/konfirm/node-decoy/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/konfirm/node-decoy/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/konfirm/node-decoy/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/konfirm/node-decoy/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/konfirm/node-decoy/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/konfirm/node-decoy/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/konfirm/node-decoy/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/konfirm/node-decoy/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/konfirm/node-decoy/releases/tag/v1.0.0
