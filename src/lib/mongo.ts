import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

export async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;

  if (!global._mongoosePromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

    global._mongoosePromise = mongoose.connect(uri).then(
      (m) => { global._mongoosePromise = undefined; return m; },
      (err) => { global._mongoosePromise = undefined; throw err; },
    );
  }

  await global._mongoosePromise;
}
