module.exports = {
    "smptp": {
        "host": "smtp.ethereal.email",
        "port": 587, // or 465
        "secure": false,
        "auth": {
            "user": "abc",
            "password": "password"
        }
    },
    "slack": {
        "url": "url"
    },
    "branches": {
        "source": ["release/chromium", "non/existing/branch"],
        "target": "develop"
    }
}