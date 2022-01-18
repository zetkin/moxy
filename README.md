# Moxy – The Mocking Proxy

Moxy simplifies HTTP/REST mocking, spying and proxying for testing in Node.

When you set up a moxy server, you can set mocks to intercept requests and return mock data. If there is no mock set, the request
will be forwarded.

## API

You can set and remove mocks and see the logs through the moxy library or via HTTP by sending requests to the moxy server.

### Starting Moxy

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

#### **Setting Mocks**

- Set a mock for a method on a path - `/<path>/_mocks/<method>` - `PUT`

  - Defaults
    - You do not need to send any configuration to set a mock on the endpoint. If you do not configure the mock, the default response will be:
      - `200` status
      - No added headers
      - No response body
  - Setting a custom response
    - To set a custom response send an object using the following format in the body of the request:
      ```
        {
          response: {
            status: 204,
            data: {
              name: "Jerry Seinfeld"
            },
            headers: [
              ['Connection': 'close']
            ]
          }
        }
      ```
      All properties are optional. Excluding any of the properties will cause the default to be set.
  - Example usage

    ```ts
    // Sets a mock on the path /people/12 for get requests.
    fetch('/people/12/_mocks/get', {
      method: 'PUT',
      headers: [['Content-Type', 'application/json']],
      body: {
        response: {
          data: {
            name: 'Jerry Seinfeld',
            placeOfBirth: 'Queens, New York',
          },
        },
      },
    })
    ```

#### **Removing Mocks**

- Remove all mocks - `/_mocks` - `DELETE`

  - Removes all mocks that have been set since initialising moxy.
  - Example usage
    ```ts
    fetch('/_mocks', {
      method: 'DELETE',
    })
    ```

- Remove all mocks on path - `<path>/_mocks` - `DELETE`

  - Removes all mocks that have been set on a path, regardless of method.
  - Example usage
    ```ts
    // Removes any previously set mocks on the path /login
    fetch('login/_mocks', {
      method: 'DELETE',
    })
    ```

- Remove all mocks on path for method - `<path>/_mocks/<method>` - `DELETE`
  - Removes a mock set on a path for a specific method.
  - Example usage
    ```ts
    // Removes a mock for handling POST requests to the /login route
    fetch('login/_mocks/post', {
      method: 'DELETE',
    })
    ```

### JS / TypeScript

- `moxy.log(path?: string) => { log: LoggedRequest[], path?: string }`
  - `moxy.log()` returns all requests made to the moxy server since `moxy.start()`.
  - `moxy.log(path)` returns all requests made on that path. Includes the path in the response

### Limitations

- Moxy can only be used to mock sub routes. It can't be used to mock `/` at this time.
