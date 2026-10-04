export default async function handler(req, res) {
  try {
    const key = process.env.METALS_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "METALS_API_KEY is not configured."
      });
    }

    const url =
      `https://api.metals.dev/v1/latest?api_key=${encodeURIComponent(key)}` +
      `&currency=INR&unit=g`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      return res.status(502).json({
        error: data.error_message || "Metals.Dev request failed."
      });
    }

    // IBJA gold reference price
    const pure24 = Number(data.metals?.ibja_gold);

    if (!Number.isFinite(pure24)) {
      return res.status(502).json({
        error: "IBJA gold price was not returned by Metals.Dev."
      });
    }

    // Purity conversion.
    // GST, making charges and jeweller premiums are excluded.
    const rates = {
      "24K": pure24,
      "22K": pure24 * (22 / 24),
      "18K": pure24 * (18 / 24)
    };

    return res.status(200).json({
      source: "Metals.Dev / IBJA",
      timestamp: data.timestamp || new Date().toISOString(),
      currency: "INR",
      unit: "g",
      rates
    });

  } catch (error) {
    return res.status(500).json({
      error: "Unable to retrieve IBJA gold price."
    });
  }
}
