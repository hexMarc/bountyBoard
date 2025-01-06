export async function sendJSON(json: any) {
  try {
    const res = await fetch("/api/pinata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const { pinataResponse } = await res.json();
    return pinataResponse;
  } catch (error) {
    console.error(error);
  }
}
