const WEBHOOK_URL = "https://hook.us2.make.com/a1hj1t6y5ldhsoplc1erlo4nr0q7w6oh";

async function createBooking(name, time, guests) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      time,
      guests,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createBooking };
}

// STEP 2 — Test it
createBooking("Mohammed", "8 PM", 2)
  .then((result) => {
    console.log("Booking response:", result);
  })
  .catch((error) => {
    console.error("Booking request failed:", error);
  });
