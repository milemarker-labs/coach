export async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.byteLength !== rightBytes.byteLength) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const [leftSig, rightSig] = await Promise.all([
    crypto.subtle.sign("HMAC", key, leftBytes),
    crypto.subtle.sign("HMAC", key, rightBytes),
  ]);
  const leftView = new Uint8Array(leftSig);
  const rightView = new Uint8Array(rightSig);
  let mismatch = 0;
  for (let index = 0; index < leftView.length; index += 1) {
    mismatch |= (leftView[index] ?? 0) ^ (rightView[index] ?? 0);
  }
  return mismatch === 0;
}
