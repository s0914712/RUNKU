import json
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "test-results" / "story-detective-quest"
BASE_URL = os.environ.get("RUNKU_TEST_URL", "http://127.0.0.1:5173")
ORIGIN = "{0.scheme}://{0.netloc}".format(urlsplit(BASE_URL))

GAME_NAMES = {"mei": "星獸偵探社・曙光檔案", "jie": "星獸偵探社・蒼藍檔案"}
STORAGE_KEYS = {"mei": "runku_story_detective_mei_v1", "jie": "runku_story_detective_jie_v1"}
VOCABULARY = {"mei": ROOT / "data" / "vocabulary.json", "jie": ROOT / "data" / "vocabulary-jie.json"}


def chinese_by_english(profile):
    words = json.loads(VOCABULARY[profile].read_text(encoding="utf-8"))["words"]
    return {word["en"].lower(): word["zh"] for word in words}


def use_profile(context, profile):
    context.add_init_script(
        f"localStorage.setItem('runku_active_profile_v2', {json.dumps(profile)});"
    )


def watch_errors(page):
    """Collect app-level errors.

    Only same-origin requests are checked: the card-game stylesheet pulls a Google
    Fonts sheet, and that request fails on sandboxed/offline machines without the
    game itself being broken. The generic "Failed to load resource" console line is
    dropped for the same reason — the network events above already cover it.
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


def clear_progress(page, profile):
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    page.evaluate(f"localStorage.removeItem('{STORAGE_KEYS[profile]}')")


def open_game(page, profile):
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button").filter(has_text=GAME_NAMES[profile]).click()
    page.get_by_test_id("story-detective-files").wait_for()


def assert_no_horizontal_overflow(page):
    sizes = page.evaluate(
        """() => ({
          viewport: window.innerWidth,
          body: document.body.scrollWidth,
          root: document.documentElement.scrollWidth,
        })"""
    )
    assert sizes["body"] <= sizes["viewport"] + 1, sizes
    assert sizes["root"] <= sizes["viewport"] + 1, sizes


def solve_open_clue(page, glossary):
    """Answer whichever puzzle type is on screen, then file the clue away."""
    puzzle = page.get_by_test_id("story-detective-puzzle")
    puzzle.wait_for()
    word = puzzle.get_attribute("data-word").lower()
    kind = puzzle.get_attribute("data-kind")

    if kind == "spell":
        for letter in word.replace(" ", ""):
            tiles = page.locator(".sd-letter-bank button:not(.is-used)")
            clicked = False
            for index in range(tiles.count()):
                tile = tiles.nth(index)
                if tile.inner_text().strip().lower() == letter:
                    tile.click()
                    clicked = True
                    break
            assert clicked, f"No unused tile for {letter!r} in {word!r}"
        page.get_by_role("button", name="採集這個線索").click()
    else:
        # choose-zh shows Chinese options; every other kind shows English ones.
        wanted = glossary[word] if kind == "choose-zh" else word
        options = page.locator(".sd-options > button:not(.sd-hint-wide)")
        clicked = False
        for index in range(options.count()):
            option = options.nth(index)
            if wanted in option.inner_text().strip().lower():
                option.click()
                clicked = True
                break
        assert clicked, f"No option matching {wanted!r} for {word!r} (kind {kind!r})"

    page.locator(".sd-verdict-correct").wait_for()
    assert word.upper() in page.locator(".sd-verdict-correct b").inner_text().upper()
    page.get_by_role("button", name="記下線索 →").click()
    return word


def solve_case(page, glossary):
    words = []
    for _ in range(5):
        page.locator(".sd-spots button:not(.is-found)").first.click()
        words.append(solve_open_clue(page, glossary))
    return words


def accuse_until_correct(page):
    suspects = page.locator(".sd-suspect:not(.is-ruled-out)")
    for _ in range(3):
        suspects.first.click()
        if page.get_by_test_id("story-detective-report").count():
            return
    raise AssertionError("None of the three suspects closed the case")


def desktop_flow(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    use_profile(context, "mei")
    page = context.new_page()
    clear_progress(page, "mei")
    errors = watch_errors(page)
    open_game(page, "mei")

    files = page.get_by_test_id("story-detective-files")
    assert "0/4" in files.inner_text(), files.inner_text()
    assert "1/30" in files.inner_text(), files.inner_text()
    # Only the first case starts unlocked.
    assert page.locator(".sd-folder.is-locked").count() == 3
    page.screenshot(path=OUTPUT / "files-desktop.png", full_page=True)

    page.locator(".sd-folder:not(.is-locked)").first.click()
    page.get_by_test_id("story-detective-scene").wait_for()
    assert page.get_by_test_id("story-detective-deduce").is_disabled()
    page.screenshot(path=OUTPUT / "scene-desktop.png", full_page=True)

    page.locator(".sd-spots button").first.click()
    page.get_by_test_id("story-detective-puzzle").wait_for()
    page.screenshot(path=OUTPUT / "puzzle-desktop.png", full_page=True)
    page.get_by_role("button", name="← 回到現場").click()

    words = solve_case(page, chinese_by_english("mei"))
    assert len(set(words)) == 5, words
    assert page.locator(".sd-spots button.is-found").count() == 5

    page.get_by_test_id("story-detective-deduce").click()
    deduction = page.get_by_test_id("story-detective-deduction")
    deduction.wait_for()
    assert deduction.locator(".sd-suspect").count() == 3
    # All five findings are carried into the notebook the deduction is made from.
    assert deduction.locator(".sd-notebook li.is-found").count() == 5
    page.screenshot(path=OUTPUT / "deduction-desktop.png", full_page=True)

    accuse_until_correct(page)
    report = page.get_by_test_id("story-detective-report")
    report.wait_for()
    assert "1/4" in report.inner_text(), report.inner_text()
    assert "2/30" in report.inner_text(), report.inner_text()
    page.screenshot(path=OUTPUT / "report-desktop.png", full_page=True)

    # Solving case 1 unlocks case 2, and the result survives a reload.
    page.get_by_role("button", name="回檔案室").click()
    files.wait_for()
    assert page.locator(".sd-folder.is-solved").count() == 1
    assert page.locator(".sd-folder.is-locked").count() == 2

    open_game(page, "mei")
    assert "1/4" in page.get_by_test_id("story-detective-files").inner_text()
    assert page.locator(".sd-folder.is-solved").count() == 1

    assert errors == [], errors
    context.close()


def sister_flow(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    use_profile(context, "jie")
    page = context.new_page()
    clear_progress(page, "jie")
    errors = watch_errors(page)
    open_game(page, "jie")
    assert "蒼藍檔案" in page.get_by_test_id("story-detective-files").inner_text()
    # The two sisters get different casebooks.
    assert page.get_by_text("曙光檔案", exact=False).count() == 0

    page.locator(".sd-folder:not(.is-locked)").first.click()
    page.get_by_test_id("story-detective-scene").wait_for()
    solve_case(page, chinese_by_english("jie"))
    page.get_by_test_id("story-detective-deduce").click()
    page.get_by_test_id("story-detective-deduction").wait_for()
    accuse_until_correct(page)
    page.get_by_test_id("story-detective-report").wait_for()
    page.screenshot(path=OUTPUT / "report-sister-desktop.png", full_page=True)

    assert errors == [], errors
    context.close()


def profile_scope(browser):
    for profile, hidden in (("jie", "曙光檔案"), ("mei", "蒼藍檔案")):
        context = browser.new_context(viewport={"width": 1024, "height": 800})
        use_profile(context, profile)
        page = context.new_page()
        page.goto(f"{BASE_URL}/games")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text(GAME_NAMES[profile], exact=True).count() == 1
        assert page.get_by_text(hidden, exact=False).count() == 0
        context.close()


def mobile_flow(browser):
    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    use_profile(context, "mei")
    page = context.new_page()
    glossary = chinese_by_english("mei")
    clear_progress(page, "mei")
    errors = watch_errors(page)
    open_game(page, "mei")
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "files-mobile.png", full_page=True)

    page.locator(".sd-folder:not(.is-locked)").first.click()
    page.get_by_test_id("story-detective-scene").wait_for()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "scene-mobile.png", full_page=True)

    # Walk the whole case on a phone so every puzzle type gets a narrow-viewport check.
    for _ in range(5):
        page.locator(".sd-spots button:not(.is-found)").first.click()
        page.get_by_test_id("story-detective-puzzle").wait_for()
        assert_no_horizontal_overflow(page)
        solve_open_clue(page, glossary)

    page.screenshot(path=OUTPUT / "notebook-mobile.png", full_page=True)
    page.get_by_test_id("story-detective-deduce").click()
    page.get_by_test_id("story-detective-deduction").wait_for()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "deduction-mobile.png", full_page=True)

    accuse_until_correct(page)
    page.get_by_test_id("story-detective-report").wait_for()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "report-mobile.png", full_page=True)

    assert errors == [], errors
    context.close()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop_flow(browser)
        sister_flow(browser)
        profile_scope(browser)
        mobile_flow(browser)
        browser.close()
    print("Story detective quest: clue puzzles, notebook, deduction, unlocks, persistence, profile scope, and mobile layout passed.")


if __name__ == "__main__":
    main()
