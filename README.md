# @ridi/tracking

[![npm](https://img.shields.io/npm/v/@ridi/ridi-tracking.svg)](https://www.npmjs.com/package/@ridi/ridi-tracking)
[![Build Status](https://travis-ci.org/ridi/ridi-tracking.svg?branch=master)](https://travis-ci.org/ridi/ridi-tracking)
[![Greenkeeper badge](https://badges.greenkeeper.io/ridi/ridi-tracking.svg)](https://greenkeeper.io/)

Provides tracking API that helps to send events to various logging services like Google Analytics, RIDI beacon system

## Install

```bash
$ npm install @ridi/tracking
```

## Usage

```javascript
import { Tracker, DeviceType } from '@ridi/tracking';

const tracker = new Tracker({
  deviceType: DeviceType.PC,
  userId: 'ridi',
  gaOptions: {
    trackingId: 'UA-XXXXXXXX-X',
    fields: {
      contentGroup5: 'PAPERSHOP'
    }
  }
});

tracker.initialize();

tracker.sendPageView(location.href);
```

## API

### `new Tracker(MainTrackerOptions)`

#### MainTrackerOptions

| Key                       | Required | Type            | Description                                                  |
| ------------------------- | -------- | --------------- | ------------------------------------------------------------ |
| `debug`                   | false    | `boolean`       | Defaults to `false`  If set to `true`, All fired events are logged to browser via `console.log` |
| `userId`                  | false    | `string`        | Logged user's identifier.                                    |
| `deviceType`              | true     | `DeviceType`    | Type of connected user's device. Please refer `DeviceType` type |
| `gaOptions`               | true     | `GAOptions`     | Options related with Google Analytics tracking module        |
| `gaOptions.trackingId`    | true     | `string`        | GA Tracking ID like `UA-000000-01`.                          |
| `gaOptions.fields`        | false    | `string`        | [GA configurable create only fields.](https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference) |
| `beaconOptions`           | false    | `BeaconOptions` | Options related with Beacon tracking module                  |
| `beaconOptions.beaconSrc` | false    | `string`        | Source of the image to be used as a beacon                   |

### `Tracker.initialize()`

`@ridi/tracking` must be initialized by using this method before any of the other tracking functions will record any data. 

### `Tracker.sendPageView(href, referrer)`

| Key        | Required | Type   | Description                                   |
| ---------- | -------- | ------ | --------------------------------------------- |
| `href`     | true     | string | e.g `https://example.com/path?key=value#hash` |
| `referrer` | false    | string | e.g `https://google.com/search?q=example`     |

### `Tracker.set(ChangeableTrackerOptions)`

Allow to set (change) `MainTrackerOptions `'s attributes

#### ChangeableTrackerOptions

| Key          | Required | Type         | Description |
| ------------ | -------- | ------------ | ----------- |
| `userId`     | false    | `string`     |             |
| `deviceType` | false    | `DeviceType` |             |



## Development

```bash
$ git clone https://github.com/ridi/ridi-tracking && cd ridi-tracking
$ npm install
$ npm watch
```

## Test

```bash
$ npm run test // TBD
```

## LICENSE

MIT