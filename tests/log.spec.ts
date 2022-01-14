import moxy from "../src/index";
import fetch from 'node-fetch'

describe("Retrieve request log", () => {
    test("with HTTP", async () => {
        const { start, stop } = moxy({ port: 1111 });
        start()
        const res = await fetch('http://localhost:1111/_log')
        const body = await res.json()
        expect(body).toEqual({ log: [] })
        stop()
    });
});
