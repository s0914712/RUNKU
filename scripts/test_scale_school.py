import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from runku_test_utils import BASE_URL, assert_head_assets_resolve, reset_storage, watch_errors


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "test-results" / "scale-school"
STORAGE_KEY = "runku_scale_school_mei_v1"
GAME_NAME = "星獸音階教室"

# D 大調從 D4 出發：D E F♯ G A B C♯ D。這裡用 MIDI 音高獨立寫死，
# 和 musicTheory.js 的算法互相對照——兩邊都對才算對。
D_MAJOR_MIDI = [62, 64, 66, 67, 69, 71, 73, 74]
D_MAJOR_NAMES = ["D", "E", "F♯", "G", "A", "B", "C♯", "D"]


def use_profile(context, profile):
    context.add_init_script(
        f"localStorage.setItem('runku_active_profile_v2', {json.dumps(profile)});"
    )


def open_game(page):
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button").filter(has_text=GAME_NAME).click()
    page.get_by_test_id("scale-school-map").wait_for()


def seed_cleared(page, level_ids):
    page.evaluate(
        "([key, ids]) => localStorage.setItem(key, JSON.stringify({ version: 1, cleared: ids, best: {} }))",
        [STORAGE_KEY, level_ids],
    )


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


def press(page, midi):
    page.locator(f'.ss-keyboard button[data-midi="{midi}"]').click()


def lesson_flow(page):
    """The opening lesson teaches a half step then a whole step from C."""
    lesson = page.get_by_test_id("scale-school-lesson")
    lesson.wait_for()
    # 半音 = C 往右一個鍵（C♯ = 61）；全音 = C 往右兩個鍵（D = 62）。
    for answer in (61, 62):
        press(page, answer)
        page.locator(".ss-verdict.is-correct").wait_for()
        page.get_by_role("button", name="下一步 →").click()
    page.get_by_role("button", name="我懂了，開始按音階 ➜").click()


def build_d_major(page):
    build = page.get_by_test_id("scale-school-build")
    build.wait_for()
    assert build.get_attribute("data-level") == "major-D", build.get_attribute("data-level")

    # 按錯不能前進，而且要給回饋。
    press(page, 63)  # E♭ 不在 D 大調裡
    page.locator(".ss-verdict.is-wrong").wait_for()
    assert build.get_attribute("data-progress") == "0"

    for step, midi in enumerate(D_MAJOR_MIDI):
        press(page, midi)
        assert build.get_attribute("data-progress") == str(step + 1), (step, midi)

    done = page.get_by_test_id("scale-build-done")
    done.wait_for()
    shown = done.inner_text()
    for name in D_MAJOR_NAMES:
        assert name in shown, (name, shown)
    return done


def desktop_flow(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    use_profile(context, "mei")
    page = context.new_page()
    errors = watch_errors(page)
    reset_storage(page, STORAGE_KEY)
    open_game(page)
    assert_head_assets_resolve(page)

    the_map = page.get_by_test_id("scale-school-map")
    assert "0/20" in the_map.inner_text(), the_map.inner_text()
    # Only the opening lesson is unlocked to begin with.
    assert page.locator(".ss-level.is-locked").count() == 19
    page.screenshot(path=OUTPUT / "map-desktop.png", full_page=True)

    page.locator(".ss-level:not(.is-locked)").first.click()
    lesson_flow(page)
    page.screenshot(path=OUTPUT / "build-desktop.png", full_page=True)

    build_d_major(page)

    # 指板要指出最後一個音在小提琴上的位置：D5 是 A 弦三指。
    fingerboard = page.get_by_test_id("scale-fingerboard").inner_text()
    assert "A 弦" in fingerboard and "三指" in fingerboard, fingerboard
    page.screenshot(path=OUTPUT / "done-desktop.png", full_page=True)

    page.get_by_role("button", name="完成這一關 →").click()
    # 過關後自動進到下一關（G 大調），而且地圖上會多一個已完成。
    page.get_by_test_id("scale-school-build").wait_for()
    assert page.get_by_test_id("scale-school-build").get_attribute("data-level") == "major-G"
    page.get_by_role("button", name="← 音階地圖").click()
    the_map.wait_for()
    assert page.locator(".ss-level.is-cleared").count() == 2, "教學關與 D 大調都該記成完成"

    # 重整之後進度還在。
    open_game(page)
    assert page.locator(".ss-level.is-cleared").count() == 2

    assert errors == [], errors
    context.close()


def ear_flow(browser):
    """Ear training is level 7, so unlock the first six to reach it directly."""
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    use_profile(context, "mei")
    page = context.new_page()
    errors = watch_errors(page)
    reset_storage(page, STORAGE_KEY)
    seed_cleared(page, ["lesson-steps", "major-D", "major-G", "major-A", "major-C", "natural-A"])
    open_game(page)

    page.locator('.ss-level[data-level="ear-1"]').click()
    ear = page.get_by_test_id("scale-school-ear")
    ear.wait_for()
    page.screenshot(path=OUTPUT / "ear-desktop.png", full_page=True)

    for question in range(5):
        assert f"{question + 1} / 5" in ear.inner_text()
        page.locator('.ss-ear-options button[data-choice="major"]').click()
        verdict = page.locator(".ss-verdict")
        verdict.wait_for()
        # 不管答對答錯都要揭曉正確答案，才學得到東西。
        assert "大調" in verdict.inner_text() or "小調" in verdict.inner_text()
        page.get_by_role("button", name="看成績 →" if question == 4 else "下一題 →").click()

    page.get_by_test_id("scale-school-build").wait_for()
    assert errors == [], errors
    context.close()


def sister_scope(browser):
    context = browser.new_context(viewport={"width": 1024, "height": 800})
    use_profile(context, "jie")
    page = context.new_page()
    page.goto(f"{BASE_URL}/games")
    page.wait_for_load_state("networkidle")
    # 音階教室是為了配合妹妹的小提琴課，姊姊那邊不出現。
    assert page.get_by_text(GAME_NAME, exact=True).count() == 0
    context.close()


def mobile_flow(browser):
    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    use_profile(context, "mei")
    page = context.new_page()
    errors = watch_errors(page)
    reset_storage(page, STORAGE_KEY)
    seed_cleared(page, ["lesson-steps"])
    open_game(page)
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "map-mobile.png", full_page=True)

    page.locator('.ss-level[data-level="major-D"]').click()
    page.get_by_test_id("scale-school-build").wait_for()
    assert_no_horizontal_overflow(page)
    # 一個八度固定是八個白鍵。手機上遊戲框改成滿版，把 app 外層的左右留白也讓給鍵盤，
    # 390px 的螢幕上白鍵才有 43px——接近 44px 的觸控標準，而且整個八度都看得到、不用捲動。
    box = page.locator(".ss-key-white").first.evaluate(
        "element => { const r = element.getBoundingClientRect(); return { w: r.width, h: r.height }; }"
    )
    assert box["w"] >= 42, box
    assert box["h"] >= 140, box
    assert page.locator(".ss-key-white").count() == 8
    page.screenshot(path=OUTPUT / "build-mobile.png", full_page=True)

    for midi in D_MAJOR_MIDI:
        press(page, midi)
    page.get_by_test_id("scale-build-done").wait_for()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT / "done-mobile.png", full_page=True)

    assert errors == [], errors
    context.close()


def small_phone_layout(browser):
    """The narrowest phones still have to fit a whole octave without scrolling."""
    context = browser.new_context(viewport={"width": 360, "height": 780})
    use_profile(context, "mei")
    page = context.new_page()
    reset_storage(page, STORAGE_KEY)
    seed_cleared(page, ["lesson-steps"])
    open_game(page)
    page.locator('.ss-level[data-level="major-D"]').click()
    page.get_by_test_id("scale-school-build").wait_for()
    assert_no_horizontal_overflow(page)
    assert page.locator(".ss-key-white").count() == 8
    width = page.locator(".ss-key-white").first.evaluate("element => element.getBoundingClientRect().width")
    assert width >= 38, width
    context.close()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop_flow(browser)
        ear_flow(browser)
        sister_scope(browser)
        mobile_flow(browser)
        small_phone_layout(browser)
        browser.close()
    print("Scale school: lesson, scale building, wrong-note feedback, fingerboard, ear training, unlocks, persistence, profile scope, and mobile layout passed.")


if __name__ == "__main__":
    main()
