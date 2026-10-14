import assert from "node:assert/strict";
import {test} from "node:test";
import worker from "../src/worker.js";

const routes = new Map([
  ["/tidewater", "https://dgreenheck.github.io/tidewater/"],
  ["/rainyworlds", "https://camper.rainyworlds.com/"],
  ["/wipeout", "https://phoboslab.org/wipeout/"],
  ["/globe", "https://experiments.withgoogle.com/chrome/globe"]
]);

for (const [path, destination] of routes) {
  for (const suffix of ["", "/"]) {
    for (const method of ["GET", "HEAD"]) {
      test(`${method} ${path}${suffix} redirects directly to the external project`, async () => {
        const response = await worker.fetch(new Request(
          `https://jesuslovesyou.dk${path}${suffix}`, {method}), {}, {});
        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), destination);
        assert.equal(await response.text(), "");
      });
    }
  }
}

test("External project redirects ignore optional query strings", async () => {
  const response = await worker.fetch(new Request(
    "https://jesuslovesyou.dk/tidewater/?preview=1"), {}, {});
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), routes.get("/tidewater"));
});
