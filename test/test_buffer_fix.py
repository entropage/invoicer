import sys

from playwright.sync_api import sync_playwright


def test_browser_errors():
    print("Starting browser error check...")
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        page = browser.new_page()

        # Enable console message collection
        def handle_console(msg):
            print(f"Browser {msg.type}:", msg.text)
            if msg.args:
                for arg in msg.args:
                    print(f"  Arg:", arg.json_value())

        page.on("console", handle_console)

        # Handle page errors
        def handle_page_error(error):
            print("Page Error:", error.message)
            print("Stack Trace:", error.stack)

        page.on("pageerror", handle_page_error)

        try:
            print("Navigating to login page...")
            page.goto("http://10.0.0.105:3000/login", wait_until="networkidle")

            # First wait for loading message
            loading = page.wait_for_selector("text=Loading...", timeout=5000)
            if loading:
                print("Found loading message")

            # Then wait for form
            page.wait_for_selector("form", timeout=10000)
            print("Login form rendered successfully")

            # Take screenshot
            page.screenshot(path="test/login-page.png")
            print("Screenshot saved as login-page.png")

        except Exception as e:
            print("Test failed:", str(e))
            sys.exit(1)
        finally:
            browser.close()


if __name__ == "__main__":
    test_browser_errors()
