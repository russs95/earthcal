We need a way for our non-mac-app-store macOS earthcal to be able to check its version, see if theres a newer one available and at the very least, let the user know they should download it.  

Later we'll use sparkle for this process.  

However, for the moment lets build and deploy a lightweight EarthCal macOS update-check system based on a PHP endpoint.

Goal:
Create `/api/version_check.php` on the EarthCal server so the macOS app can compare its local version to the latest available version online at launch.

Requirements:

1. Create a PHP endpoint at `/api/version_check.php`.
2. The endpoint must return JSON with this shape:

```json
{
  "app": "EarthCal",
  "latest_version": "1.3.8",
  "latest_build": "2",
  "minimum_supported_version": "1.3.8",
  "download_url": "https://earthcal.org/downloads/EarthCal-1.3.7.dmg",
  "release_notes_url": "https://earthcal.org/releases/0.9.0.2.html",
  "published_at": "2026-04-13T12:00:00Z",
  "critical": false,
  "message": "A new version of EarthCal is available."
}
```

3. The endpoint must:

* send `Content-Type: application/json; charset=utf-8`
* allow only `GET`
* return proper HTTP status codes
* fail safely with a JSON error response
* not expose stack traces or server internals

4. Version source:

* Store the current latest version info in a simple config file, preferably JSON or PHP array, outside the web root if practical
* `version_check.php` should read from that config and output the response
* make it easy for me to update the latest version by editing one file

5. Optional request parameters:

* support `?app=EarthCal`
* support `?current_version=0.9.0.1`
* if `current_version` is supplied, include:

```json
"update_available": true
```

or false based on semantic version comparison

6. Version comparison:

* Compare dotted version strings like `0.9.0.1`
* Also compare `latest_build` if needed when versions are equal
* Write a safe helper for version comparison in PHP

7. Security and robustness:

* validate and sanitize query parameters
* do not trust user input
* reject non-GET requests with 405
* include basic cache headers suitable for a lightweight API
* keep code simple and dependency-free

8. Deployment:

* place the endpoint in the correct EarthCal public web directory
* place the config file in a sensible secure location
* ensure the endpoint works on the current server PHP setup
* provide exact file paths assumed during deployment
* provide exact shell commands for upload, permissions, and quick testing with `curl`

9. Deliverables:

* full contents of `version_check.php`
* full contents of the config file
* any needed `.htaccess` addition only if necessary
* a short deployment checklist
* example `curl` tests
* one example JSON success response
* one example JSON error response

10. Keep this first version simple:

* no database
* no admin panel
* no authentication
* just a reliable read-only version check endpoint for the EarthCal macOS app

Please generate production-ready code with comments, and assume this will be deployed on a typical PHP hosting/server environment.
