export const Headers = {
    user: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
        ...(process.env.TOKEN ? { "Access-Control-Allow-Headers": "Authorization" } : {})
    },
    everyone: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, GET"
    }
}