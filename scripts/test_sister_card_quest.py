import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "test-results" / "sister-card-quest"
BASE_URL = os.environ.get("RUNKU_TEST_URL", "http://127.0.0.1:5173")


def use_profile(context, profile):
    context.add_init_script(
        f"localStorage.setItem('runku_active_profile_v2', {json.dumps(profile)});"
    )


def open_card_game(page):
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button").filter(has_text="星獸單字卡牌戰").click()
    page.locator(".cq-intro h1").wait_for()


def assert_no_overflow(page):
    overflow = page.evaluate(
        """() => ({
          width: window.innerWidth,
          body: document.body.scrollWidth,
          root: document.documentElement.scrollWidth,
        })"""
    )
    assert overflow["body"] <= overflow["width"] + 1, overflow
    assert overflow["root"] <= overflow["width"] + 1, overflow


def desktop_flow(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    use_profile(context, "jie")
    page = context.new_page()
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: errors.append(f"HTTP {response.status}: {response.url}") if response.status >= 400 else None)

    open_card_game(page)
    intro_stats = page.locator(".cq-feature-row").inner_text()
    assert "39" in intro_stats and "8" in intro_stats
    assert page.locator(".cq-intro-showcase img").count() == 4
    assert all(
        width > 0
        for width in page.locator(".cq-intro-showcase img").evaluate_all(
            "images => images.map(image => image.naturalWidth)"
        )
    )
    page.screenshot(path=OUTPUT / "intro-desktop.png", full_page=True)

    page.get_by_role("button", name="開啟星光卡包 ✦").click()
    page.get_by_role("button", name="撕開星光卡包").wait_for()
    page.screenshot(path=OUTPUT / "booster-desktop.png", full_page=True)
    page.get_by_role("button", name="撕開星光卡包").click()
    page.get_by_role("heading", name="從八張卡選兩隻組隊").wait_for()
    assert page.locator(".cq-card-grid .cq-card").count() == 8
    assert page.locator(".cq-card-grid img").evaluate_all(
        "images => images.every(image => image.naturalWidth > 0)"
    )
    card_text = page.locator(".cq-card-grid").inner_text()
    assert "SKYHARE" in card_text and "ENGLISH STORY" in card_text
    page.locator('.cq-card[data-beast="skyhare"]').click()
    page.locator('.cq-card[data-beast="mosscub"]').click()
    assert page.locator(".cq-card-grid .is-selected").count() == 2
    page.screenshot(path=OUTPUT / "deck-builder-desktop.png", full_page=True)

    page.get_by_role("button", name="帶著牌組出戰 ⚔").click()
    page.get_by_test_id("card-quest-battle").wait_for()
    assert "屬性有利" in page.locator(".cq-deck-panel").inner_text()
    page.locator(".cq-sound-button").click()
    page.screenshot(path=OUTPUT / "battle-desktop.png", full_page=True)

    page.locator('.cq-word-hand button[data-correct="false"]').first.click()
    page.locator(".cq-feedback-wrong").wait_for()
    assert "7 / 8" in page.locator(".cq-player-zone .cq-hp").inner_text()
    page.get_by_role("button", name="下一回合 →").click()

    for turn in range(3):
        page.locator('.cq-word-hand button[data-correct="true"]').click()
        page.locator(".cq-feedback-correct").wait_for()
        if turn < 2:
            page.get_by_role("button", name="下一回合 →").click()
        else:
            page.get_by_role("button", name="收下勝利卡 →").click()

    page.locator(".cq-result.is-victory").wait_for()
    assert "勝利！" in page.locator(".cq-result h1").inner_text()
    page.screenshot(path=OUTPUT / "victory-desktop.png", full_page=True)
    records = json.loads(page.evaluate("localStorage.getItem('runku_sister_card_quest_v1')"))
    assert records["wins"] == 1, records
    assert len(records["mastered"]) == 3, records

    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("button").filter(has_text="星獸單字卡牌戰").click()
    page.locator(".cq-intro h1").wait_for()
    stats = page.locator(".cq-feature-row").inner_text()
    assert "競技場勝場" in stats and "1" in stats
    assert errors == [], errors
    context.close()


def profile_scope_test(browser):
    context = browser.new_context(viewport={"width": 1024, "height": 800})
    use_profile(context, "mei")
    page = context.new_page()
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("星獸單字卡牌戰", exact=True).count() == 0
    context.close()


def mobile_flow(browser):
    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    use_profile(context, "jie")
    page = context.new_page()
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: errors.append(f"HTTP {response.status}: {response.url}") if response.status >= 400 else None)

    open_card_game(page)
    assert_no_overflow(page)
    page.screenshot(path=OUTPUT / "intro-mobile.png", full_page=True)
    page.get_by_role("button", name="開啟星光卡包 ✦").click()
    page.get_by_role("button", name="撕開星光卡包").click()
    page.get_by_role("heading", name="從八張卡選兩隻組隊").wait_for()
    page.wait_for_timeout(1100)
    assert_no_overflow(page)
    page.screenshot(path=OUTPUT / "deck-builder-mobile.png", full_page=True)
    assert errors == [], errors
    context.close()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop_flow(browser)
        profile_scope_test(browser)
        mobile_flow(browser)
        browser.close()
    print("Sister card quest: desktop battle, persistence, profile scope, and mobile layout passed.")


if __name__ == "__main__":
    main()
