# Webhook Security Configuration

## Overview

The webhook endpoint is protected by a secret token authentication mechanism to prevent unauthorized data submissions.

## Setup Instructions

### 1. Generate a Secret Token

Generate a random secret token using one of these methods:

**Using OpenSSL (Recommended):**
```bash
openssl rand -hex 32
```

**Using Python:**
```python
import secrets
print(secrets.token_hex(32))
```

**Example output:**
```
5def9e99ef734fe9f2b0e2e03e7a4dc766476e57f44e0415d0c1901ae6f1a194
```

### 2. Configure Environment Variable

Add the generated token to your environment configuration:

**In Coolify:**
1. Go to your application settings
2. Navigate to "Environment Variables"
3. Add: `WEBHOOK_SECRET=your_generated_token_here`
4. Redeploy the application

**In Docker Compose:**
```yaml
environment:
  - WEBHOOK_SECRET=your_generated_token_here
```

**In .env file (local development):**
```bash
WEBHOOK_SECRET=your_generated_token_here
```

### 3. Configure Distill Web Monitor

When setting up your webhook in Distill:

1. Go to Distill settings → Webhooks
2. Set the URL with token parameter: `https://your-domain.com/webhook/distill?token=your_generated_token_here`
   - Replace `your_generated_token_here` with the same token from step 1

## Security Features

- ✅ **Token-based authentication**: Only requests with the correct token are accepted
- ✅ **URL parameter-based**: Token sent via query parameter (?token=xxx)
- ✅ **Backward compatible**: If `WEBHOOK_SECRET` is not set, authentication is disabled (NOT recommended for production)

## Testing

Test your webhook configuration:

```bash
# Without token (should fail)
curl -X POST https://your-domain.com/webhook/distill \
  -H "Content-Type: application/json" \
  -d '{"id":"test","uri":"https://example.com","text":"100"}'

# Response: 401 Unauthorized

# With correct token (should succeed)
curl -X POST "https://your-domain.com/webhook/distill?token=your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"id":"test","uri":"https://example.com","text":"100"}'

# Response: {"status":"success",...}
```

## Troubleshooting

**Webhook requests are being rejected:**
- Check that `WEBHOOK_SECRET` is set in your environment
- Verify the token in URL parameter matches exactly (no extra spaces)
- Ensure the token is properly URL-encoded if it contains special characters

**Old webhooks stopped working after update:**
- Set `WEBHOOK_SECRET` in Coolify environment variables
- Update Distill webhook URL to include the ?token=xxx parameter

## Security Best Practices

1. **Use a strong random token** - At least 32 bytes (64 hex characters)
2. **Keep the token secret** - Never commit it to git
3. **Rotate the token periodically** - Update both server and Distill
4. **Use HTTPS** - Always use HTTPS in production
5. **Monitor logs** - Check for unauthorized access attempts
