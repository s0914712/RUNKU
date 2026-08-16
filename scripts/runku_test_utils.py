"""Shared helpers for the RUNKU Playwright suites.

The tests are run as `python3 scripts/test_<game>.py`, so `scripts/` is already on
sys.path and this module imports as `runku_test_utils`.
"""

import os
from urllib.parse import urlsplit

# Vite serves the app under a `/RUNKU/` base (see frontend/vite.config.js), so every
# route lives below it — pointing at the bare host returns a 404.
BASE_URL = os.environ.get("RUNKU_TEST_URL", "http://127.0.0.1:5173/RUNKU")
ORIGIN = "{0.scheme}://{0.netloc}".format(urlsplit(BASE_URL))


def watch_errors(page):
    """Collect app-level errors from a page, returning the list they land in.

    Only same-origin requests count. The game stylesheets `@import` a Google Fonts
    sheet, and that request fails on sandboxed or offline machines without anything
    in the app being broken. The generic "Failed to load resource" console line is
    dropped for the same reason — the network handlers below already report real
    failures, with the URL attached so they can be told apart.
    """
    errors = []

    def note_console(message):
        if message.type == "error" and "Failed to load resource" not in message.text:
            errors.append(message.text)

    def note_response(response):
        if response.status >= 400 and response.url.startswith(ORIGIN):
            errors.append(f"HTTP {response.status}: {response.url}")

    def note_failure(request):
        if request.url.startswith(ORIGIN):
            errors.append(f"REQUEST FAILED {request.url}: {request.failure}")

    page.on("console", note_console)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", note_response)
    page.on("requestfailed", note_failure)
    return errors


def reset_storage(page, *keys):
    """Open the app and clear the given localStorage keys.

    Navigates to a real route rather than the bare origin, which 404s under the
    `/RUNKU/` base path.
    """
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    for key in keys:
        page.evaluate("(key) => localStorage.removeItem(key)", key)
