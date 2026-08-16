import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from runku_test_utils import BASE_URL, reset_storage, watch_errors


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "test-results" / "younger-spelling-quest"
STORAGE_KEY = "runku_younger_spelling_quest_v1"


def use_profile(context, profile):
    context.add_init_script(
        f"localStorage.setItem('runku_active_profile_v2', {json.dumps(profile)});"
    )


def open_game(page):
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button").filter(has_text="星獸拼字故事學院").click()
    page.get_by_test_id("younger-spelling-intro").wait_for()


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


def click_letters_in_order(page, spelling):
    for letter in spelling:
        candidates = page.locator(".ysq-letter-bank button:not(.is-used)")
        clicked = False
        for index in range(candidates.count()):
            candidate = candidates.nth(index)
            if candidate.inner_text().strip().lower() == letter:
                candidate.click()
                clicked = True
                break
        assert clicked, f"No unused tile found for {letter} in {spelling}"


def submit_correct_word(page):
    spelling = page.get_by_test_id("younger-spelling-game").get_attribute("data-word").lower()
    click_letters_in_order(page, spelling)
    page.get_by_role("button", name="完成拼字 SPELL!").click()
    page.locator(".ysq-feedback-correct").wait_for()
    assert spelling.upper() in page.locator(".ysq-feedback-correct h2").inner_text()
    return spelling


def desktop_flow(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    use_profile(context, "mei")
    page = context.new_page()
    reset_storage(page, STORAGE_KEY)
    errors = watch_errors(page)
    open_game(page)
    intro = page.get_by_test_id("younger-spelling-intro")
    assert "4/30" in intro.inner_text()
    assert "0/58" in intro.inner_text()
    assert intro.locator(".ysq-card-stage img").count() == 4
    assert intro.locator(".ysq-card-stage img").evaluate_all("images => images.every(image => image.naturalWidth > 0)")
    page.screenshot(path=OUTPUT / "intro-desktop.png", full_page=True)

    page.get_by_role("button", name="打開拼字故事書 ➜").click()
    game = page.get_by_test_id("younger-spelling-game")
    game.wait_for()
    target = game.get_attribute("data-word").lower()
    assert "____" in page.locator(".ysq-sentence").inner_text()
    assert "把" in page.locator(".ysq-story-page").inner_text() or "填入" in page.locator(".ysq-story-page").inner_text()
    assert page.locator(".ysq-story-heading h2").evaluate("element => parseFloat(getComputedStyle(element).fontSize)") >= 22
    page.screenshot(path=OUTPUT / "story-worktable-desktop.png", full_page=True)

    tile_buttons = page.locator(".ysq-letter-bank button")
    letters = [tile_buttons.nth(index).inner_text().strip().lower() for index in range(tile_buttons.count())]
    wrong_order = list(range(len(letters)))
    if "".join(letters) == target:
        wrong_order[0], wrong_order[1] = wrong_order[1], wrong_order[0]
    for index in wrong_order:
        tile_buttons.nth(index).click()
    page.get_by_role("button", name="完成拼字 SPELL!").click()
    page.locator(".ysq-feedback-wrong").wait_for()
    assert "不會扣分" in page.locator(".ysq-feedback-wrong").inner_text()
    records = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
    assert len(records["mastered"]) == 0, records
    page.get_by_role("button", name="再試一次").click()

    page.get_by_role("button", name="💡 提示一格 已用 0").click()
    assert page.locator(".ysq-letter-slots .is-filled").count() == 1
    assert "已用 1" in page.locator(".ysq-hint").inner_text()
    page.get_by_role("button", name="⌫ 清空").click()
    submit_correct_word(page)
    records = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
    assert len(records["mastered"]) == 1 and len(records["unlocked"]) == 4, records
    page.get_by_role("button", name="翻到下一頁 →").click()

    submit_correct_word(page)
    assert page.locator(".ysq-new-beast").count() == 1
    assert page.locator(".cq-new-ribbon").count() == 1
    records = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
    assert len(records["mastered"]) == 2 and len(records["unlocked"]) == 5, records
    page.screenshot(path=OUTPUT / "new-card-desktop.png", full_page=True)
    page.get_by_role("button", name="翻到下一頁 →").click()

    for turn in range(2, 10):
        submit_correct_word(page)
        if turn < 9:
            page.get_by_role("button", name="翻到下一頁 →").click()
        else:
            page.get_by_role("button", name="完成這一章 →").click()

    page.get_by_test_id("younger-spelling-result").wait_for()
    page.screenshot(path=OUTPUT / "result-desktop.png", full_page=True)
    records = json.loads(page.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
    assert len(records["mastered"]) == 10, records
    assert len(records["unlocked"]) == 9, records
    assert records["adventures"] == 1 and records["totalCorrect"] == 10, records

    page.get_by_role("button", name="回故事書封面").click()
    assert "9/30" in page.get_by_test_id("younger-spelling-intro").inner_text()
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("button").filter(has_text="星獸拼字故事學院").click()
    page.get_by_test_id("younger-spelling-intro").wait_for()
    assert "9/30" in page.get_by_test_id("younger-spelling-intro").inner_text()
    assert "10/58" in page.get_by_test_id("younger-spelling-intro").inner_text()
    assert errors == [], errors
    context.close()


def sister_scope(browser):
    context = browser.new_context(viewport={"width": 1024, "height": 800})
    use_profile(context, "jie")
    page = context.new_page()
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("星獸拼字故事學院", exact=True).count() == 0
    assert page.get_by_text("星獸單字卡牌戰", exact=True).count() == 1
    context.close()


def mobile_flow(browser):
    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    use_profile(context, "mei")
    page = context.new_page()
    reset_storage(page, STORAGE_KEY)
    errors = watch_errors(page)
    open_game(page)
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "intro-mobile.png", full_page=True)
    page.get_by_role("button", name="打開拼字故事書 ➜").click()
    page.get_by_test_id("younger-spelling-game").wait_for()
    assert_no_horizontal_overflow(page)
    assert page.locator(".ysq-letter-bank button").first.evaluate("element => element.getBoundingClientRect().width") >= 48
    assert page.locator(".ysq-letter-bank button").first.evaluate("element => parseFloat(getComputedStyle(element).fontSize)") >= 30
    page.screenshot(path=OUTPUT / "story-worktable-mobile.png", full_page=True)
    assert errors == [], errors
    context.close()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop_flow(browser)
        sister_scope(browser)
        mobile_flow(browser)
        browser.close()
    print("Younger spelling quest: story guidance, letter filling, unlocks, persistence, profile scope, and mobile layout passed.")


if __name__ == "__main__":
    main()
