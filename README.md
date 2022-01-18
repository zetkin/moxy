# Moxy – The Mocking Proxy

Moxy simplifies HTTP/REST mocking, spying and proxying for testing in Node.

## API

#### Starting Moxy

```js
const moxyConfig = {
    port: 8080 // Optional: the port to run the moxy server on
    forward: 'target-url.com' // Optional: Any unmocked routes will be forwarded to this URL
}

const { start, stop, setMock } = moxy(moxyConfig)

start()

// Use moxy server
setMock(...)

await stop() // Await the moxy server to close down
```

### HTTP

The HTTP API allows you to **set**, **remove**, and **log** mocks by making requests to the moxy server.

### JS / TypeScript

- `moxy.log(path?: string) => { log: LoggedRequest[], path?: string }`
  - `moxy.log()` returns all requests made to the moxy server since `moxy.start()`.
  - `moxy.log(path)` returns all requests made on that path. Includes the path in the response

### Limitations

- Moxy can only be used to mock sub routes. It can't be used to mock `/` at this time.
