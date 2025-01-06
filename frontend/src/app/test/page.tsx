"use client";

import { sendJSON } from "../../lib/ipfs/pinata";

export default function Page() {
  const handleSendJSON = async () => {
    const json = { message: "e'chate prueba titi v3" };
    try {
      const response = await sendJSON(json);
      console.log("JSON sent to IPFS:", response);
    } catch (error) {
      console.error("Error sending JSON to IPFS:", error);
    }
  };

  return (
    <div>
      <button onClick={handleSendJSON}>Send JSON to IPFS</button>
    </div>
  );
}
