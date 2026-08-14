module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let message = "";

    if (req.method === "POST") {
      if (typeof req.body === "string") {
        try {
          const body = JSON.parse(req.body);
          message = body.message || body.q || "";
        } catch {
          message = req.body;
        }
      } else {
        message = req.body?.message || req.body?.q || "";
      }
    } else {
      message = req.query?.q || "";
    }

    message = String(message).trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Pesan tidak boleh kosong."
      });
    }

    /*
     * API NexaDev
     */
    const apiUrl =
      "https://api.nexadev.my.id/ai/chatgptpro?q=" +
      encodeURIComponent(message);

    console.log("NEOAI REQUEST:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const rawText = await response.text();

    console.log("NEXADEV STATUS:", response.status);
    console.log("NEXADEV RESPONSE:", rawText);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "API NexaDev mengembalikan error.",
        status: response.status,
        details: rawText
      });
    }

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).json({
        success: false,
        error: "Respons API bukan JSON.",
        raw: rawText
      });
    }

    /*
     * Format utama API:
     *
     * {
     *   author: "NexaDev",
     *   status: true,
     *   data: {
     *     message: "..."
     *   }
     * }
     */

    const answer =
      data?.data?.message ||
      data?.message ||
      data?.answer ||
      data?.result ||
      data?.data?.answer ||
      data?.data?.result ||
      "";

    if (!answer) {
      return res.status(500).json({
        success: false,
        error: "Jawaban AI tidak ditemukan.",
        raw: data
      });
    }

    return res.status(200).json({
      success: true,
      message: String(answer),
      raw: data
    });

  } catch (error) {
    console.error("NEOAI API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Gagal menghubungkan ke API."
    });
  }
};
