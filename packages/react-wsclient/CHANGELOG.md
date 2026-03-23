## Change Log

## v1.1.2

- Add object support to `sendMessage` returned from `useWsClient` hook

## v1.1.1

- Update README documentation

## v1.1.0

### Breaking

- `isConnected` boolean returned by `useWsClient` hook changed to a function that returns the boolean. This allows the function to be called to get a new status on connectivity whereas the boolean before was only captured once during the return.

### Non-breaking

- Add all the JSDoc documentation I thought I had back in
- Reverse order of changelog with most recent changes at the top

## v1.0.2

- More README documentation
- Remove React dependencies and use only peer dependencies
- Add 'use client' directives for RSC support

## v1.0.1

- Update README with more details

## v1.0.0

Initial release of the library.
