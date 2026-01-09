"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMEOUT_HTML = exports.ERROR_HTML = exports.SUCCESS_HTML = exports.CALLBACK_PATH = exports.PORT_RANGE = exports.DEFAULT_TIMEOUT = exports.AUTHORIZE_ENDPOINT = exports.AUTH_BASE_URL = void 0;
exports.AUTH_BASE_URL = 'https://www.blok0.xyz';
exports.AUTHORIZE_ENDPOINT = '/api/authorize/cli';
exports.DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
exports.PORT_RANGE = { min: 3000, max: 4000 };
exports.CALLBACK_PATH = '/callback';
exports.SUCCESS_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .success-icon {
            color: #10b981;
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #1f2937;
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        p {
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Authentication Successful!</h1>
        <p>You can now close this window and return to your terminal.</p>
    </div>
</body>
</html>
`;
exports.ERROR_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Failed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .error-icon {
            color: #ef4444;
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #1f2937;
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        p {
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">✗</div>
        <h1>Authentication Failed</h1>
        <p>Please try again or contact support if the problem persists.</p>
    </div>
</body>
</html>
`;
exports.TIMEOUT_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Timeout</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .timeout-icon {
            color: #f59e0b;
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #1f2937;
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        p {
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="timeout-icon">⏱</div>
        <h1>Authentication Timeout</h1>
        <p>The authentication request has timed out. Please try again.</p>
    </div>
</body>
</html>
`;
