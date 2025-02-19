# DigitalOcean Spaces Viewer

A simple web-based viewer for DigitalOcean Spaces that runs entirely in the browser using Pyodide. No server required!

## Demo

Visit [https://jc9677.github.io/digitalocean-ui/](https://jc9677.github.io/digitalocean-ui/) to try it out.

## Features

- List your Spaces buckets
- Browse bucket contents and folders
- Download files using pre-signed URLs
- Runs completely client-side
- No server or backend required
- Uses Python in the browser via Pyodide

## Usage

1. Visit [https://jc9677.github.io/digitalocean-ui/](https://jc9677.github.io/digitalocean-ui/)
2. Enter your DigitalOcean Spaces credentials:
   - Access Key
   - Secret Key
   - Region (e.g., tor1)
3. Click "List Buckets" to start browsing

## CORS Configuration

Your Space needs to be configured to allow CORS requests. Use the provided `docs/cors_config.xml` file to configure CORS for your Space:

```bash
aws s3api put-bucket-cors --bucket YOUR-BUCKET-NAME --cors-configuration file://docs/cors_config.xml
```

Or configure it through the DigitalOcean web console:
1. Go to your Space settings
2. Find the CORS configuration section
3. Paste the contents of `docs/cors_config.xml`

## Security

- All credentials are kept in memory only
- No data is stored or sent to any server other than DigitalOcean Spaces
- All requests are made using pre-signed URLs
- CORS configuration ensures only authorized origins can access your Space

## Development

To run locally:
1. Start a local web server: `python -m http.server 8000`
2. Open `http://localhost:8000/docs/spaces_viewer_pyodide.html`

## License

MIT
