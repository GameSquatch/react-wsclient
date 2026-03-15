# React WebSocket Client

This project contains three sub-packages:

1. The [react client library](./packages/react-wsclient/README.md). This is the product of this project that is published to NPM.
2. The [demo app](./packages/app/README.md) that is published to github pages to show how the library works.
3. An [example ws server](./packages/server/README.md) written in Node that can also be run locally.

## MSW

[Mock Service Worker](https://mswjs.io/) is a fantastic tool that has allowed me to publish my demo app completely hosted on Github Pages, so shout out to the developers of that library.

## AI

AI was not used to generate any part of this library. I prefer to practice my skills instead of letting something else think for me.

## Typescript

I did not use Typescript for the development of the library. However, I did use JSDoc with TS checking for JS turned on, so users of the library still get complete type information. The reason I did this was simplicity for a small library as well as allowing users of the library to click into type definitions in their editor and be taken directly to the source code and not a d.ts file.
