// Simple browser hash; substitute with a stronger hash (e.g., bcrypt) for real apps.
export async function hashString(str) {
  const msgUint8 = new TextEncoder().encode(str);                    // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));           // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}



