export default async function handler(req, res) {

    /*
     * ==========================================
     * CORS
     * ==========================================
     */

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    /*
     * OPTIONS
     */

    if(req.method === "OPTIONS"){

        return res.status(200).end();

    }


    /*
     * ==========================================
     * HANYA GET
     * ==========================================
     */

    if(req.method !== "GET"){

        return res.status(405).json({

            success:false,

            error:
                "Method not allowed"

        });

    }


    /*
     * ==========================================
     * AMBIL Q
     * ==========================================
     */

    const q =
        typeof req.query?.q === "string"
            ? req.query.q.trim()
            : "";


    if(!q){

        return res.status(400).json({

            success:false,

            error:
                "Parameter q wajib diisi."

        });

    }


    /*
     * ==========================================
     * API NEXADEV
     * ==========================================
     */

    const apiURL =
        "https://api.nexadev.my.id/ai/chatgptpro?q=" +
        encodeURIComponent(q);


    try{

        console.log(
            "Calling NexaDev API..."
        );


        /*
         * Abort timeout.
         */

        const timeout =
            new AbortController();


        const timer =
            setTimeout(
                () => timeout.abort(),
                60000
            );


        const response =
            await fetch(
                apiURL,
                {

                    method:"GET",

                    headers:{
                        "Accept":
                            "application/json, text/plain, */*"
                    },

                    signal:
                        timeout.signal

                }
            );


        clearTimeout(timer);


        /*
         * Ambil response sebagai text.
         * Ini lebih aman karena kita belum
         * mengasumsikan format response.
         */

        const raw =
            await response.text();


        console.log(
            "NeoAI status:",
            response.status
        );


        console.log(
            "NeoAI raw:",
            raw.substring(0,500)
        );


        /*
         * Jika API error.
         */

        if(!response.ok){

            return res.status(
                response.status
            ).json({

                success:false,

                error:
                    "NeoAI API error",

                status:
                    response.status,

                details:
                    raw

            });

        }


        /*
         * Parse JSON.
         */

        let data;

        try{

            data =
                JSON.parse(raw);

        }catch{

            return res.status(502).json({

                success:false,

                error:
                    "NeoAI mengembalikan response bukan JSON.",

                raw:
                    raw

            });

        }


        /*
         * ==========================================
         * FORMAT API YANG KAMU KIRIM
         *
         * {
         *   author:"NeoAI",
         *   status:true,
         *   data:{
         *      message:"..."
         *   }
         * }
         * ==========================================
         */

        const answer =
            data?.data?.message ||
            data?.answer ||
            data?.message ||
            data?.response ||
            data?.content ||
            data?.text;


        if(
            typeof answer !== "string" ||
            !answer.trim()
        ){

            return res.status(502).json({

                success:false,

                error:
                    "Jawaban AI tidak ditemukan.",

                upstream:
                    data

            });

        }


        /*
         * ==========================================
         * KIRIM KE FRONTEND
         * ==========================================
         */

        return res.status(200).json({

            success:true,

            answer:

                answer,

            author:
                data?.author ||
                "NexaDev"

        });


    }catch(error){

        console.error(
            "Proxy error:",
            error
        );


        /*
         * Timeout
         */

        if(
            error?.name ===
            "AbortError"
        ){

            return res.status(504).json({

                success:false,

                error:
                    "API NeoAI timeout setelah 60 detik."

            });

        }


        /*
         * Error lainnya
         */

        return res.status(500).json({

            success:false,

            error:
                error?.message ||
                "Gagal menghubungi API NexaDev."

        });

    }

}
