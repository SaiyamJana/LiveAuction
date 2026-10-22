import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { z } from "zod";
import app from "../src/app.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { validate, getValidated } from "../src/middleware/validate.js";
import { ApiError } from "../src/utils/ApiError.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

// A small throwaway app, used only inside this test file.
// It exists so no temporary routes are needed in the real app.
const testApp = express();
testApp.use(express.json());

const bodySchema = z.object({
  email: z.string().email("Invalid email address"),
  age: z.number().int().min(18, "Must be at least 18"),
});
const querySchema = z.object({ page: z.coerce.number().int().min(1) });
const paramsSchema = z.object({ id: z.string().length(4, "id must be 4 characters") });

testApp.post(
  "/items/:id",
  validate({ body: bodySchema, query: querySchema, params: paramsSchema }),
  (_req, res) => {
    res.json({
      body: getValidated(res, "body"),
      query: getValidated(res, "query"),
      params: getValidated(res, "params"),
    });
  }
);
testApp.get("/api-error", () => {
  throw new ApiError(409, "Already exists", [{ field: "name", message: "Name is taken" }]);
});
testApp.get(
  "/async-error",
  asyncHandler(async () => {
    throw new ApiError(403, "Not allowed");
  })
);
testApp.get("/crash", () => {
  throw new Error("secret database detail");
});
testApp.use(errorHandler);

let realServer: Server;
let testServer: Server;
let realUrl = "";
let testUrl = "";

before(async () => {
  realServer = app.listen(0);
  testServer = testApp.listen(0);
  realUrl = `http://127.0.0.1:${(realServer.address() as AddressInfo).port}`;
  testUrl = `http://127.0.0.1:${(testServer.address() as AddressInfo).port}`;
});

after(() => {
  realServer.close();
  testServer.close();
});

test("GET /api/health returns 200 and { status: 'ok' }", async () => {
  const res = await fetch(`${realUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("unknown route returns a JSON 404", async () => {
  const res = await fetch(`${realUrl}/api/nope`);
  assert.equal(res.status, 404);
  const body = (await res.json()) as { message: string };
  assert.match(body.message, /Route not found/);
});

test("malformed JSON returns a JSON 400", async () => {
  const res = await fetch(`${realUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ not valid json",
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { message: "Malformed JSON in request body" });
});

test("CORS allows the frontend origin with credentials", async () => {
  const res = await fetch(`${realUrl}/api/health`, {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(res.headers.get("access-control-allow-credentials"), "true");
});

test("ApiError keeps its status and field errors", async () => {
  const res = await fetch(`${testUrl}/api-error`);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), {
    message: "Already exists",
    errors: [{ field: "name", message: "Name is taken" }],
  });
});

test("asyncHandler forwards rejected promises to the error handler", async () => {
  const res = await fetch(`${testUrl}/async-error`);
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { message: "Not allowed" });
});

test("unexpected errors return 500 without leaking details", async () => {
  const original = console.error;
  console.error = () => {}; // hide the expected server log in test output
  const res = await fetch(`${testUrl}/crash`);
  console.error = original;
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { message: "Internal server error" });
});

test("validate: invalid input returns 400 with field errors", async () => {
  const res = await fetch(`${testUrl}/items/abc?page=0`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nope", age: 10 }),
  });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { message: string; errors: { field: string }[] };
  assert.equal(body.message, "Validation failed");
  const fields = body.errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ["age", "email", "id", "page"]);
});

test("validate: valid input reaches the handler with cleaned values", async () => {
  const res = await fetch(`${testUrl}/items/abcd?page=2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "a@b.com", age: 20, extra: "removed" }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    body: { email: "a@b.com", age: 20 }, // "extra" was stripped
    query: { page: 2 }, // "2" became the number 2
    params: { id: "abcd" },
  });
});
