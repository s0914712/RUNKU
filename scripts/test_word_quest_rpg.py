import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "test-results"
RESULTS.mkdir(exist_ok=True)


def answer_turn(page, target_word):
    spell_bank = page.locator(".wq-letter-bank")
    if spell_bank.count() and spell_bank.is_visible():
        for letter in target_word.replace(" ", "").upper():
            page.locator(
                f'.wq-letter-bank button[data-letter="{letter}"]:not(:disabled)'
            ).first.click()
        page.get_by_role("button", name="施展拼字斬！").click()
    else:
        page.locator('.wq-choice-grid button[data-correct="true"]').click()

    expect(page.locator(".wq-feedback-correct")).to_be_visible()
    page.locator(".wq-feedback-correct button").click()


def run_profile(browser, profile_key, game_title, finale_title):
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    context.add_init_script(
        "if (!sessionStorage.getItem('wq_test_initialized')) { "
        "localStorage.clear(); sessionStorage.setItem('wq_test_initialized', 'true'); } "
        f"localStorage.setItem('runku_active_profile_v2', '{profile_key}');"
    )
    page = context.new_page()
    console_errors = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.goto("http://localhost:5173/games")
    page.wait_for_load_state("networkidle")

    page.get_by_text(game_title, exact=True).click()
    expect(page.locator(".wq-intro h1")).to_contain_text(game_title)
    page.get_by_role("button", name="拔出單字之劍").click()
    expect(page.locator(".wq-route")).to_be_visible()
    page.screenshot(path=RESULTS / f"word-quest-{profile_key}-map.png", full_page=True)

    tested_mistake = False
    for stage_index in range(4):
        stage = page.locator(".wq-stage").nth(stage_index)
        words = stage.locator(".wq-word-preview span").all_text_contents()
        assert len(words) == 4, f"Stage {stage_index + 1} did not expose four quest words"
        stage.get_by_role("button", name=re.compile("迎戰怪物|再次巡邏")).click()
        expect(page.locator('[data-testid="word-quest-battle"]')).to_be_visible()

        if not tested_mistake:
            wrong_choice = page.locator('.wq-choice-grid button[data-correct="false"]').first
            if wrong_choice.count() and wrong_choice.is_visible():
                wrong_choice.click()
                expect(page.locator(".wq-feedback-wrong")).to_be_visible()
                expect(page.locator(".wq-mini-hp")).to_contain_text("4/5")
                page.locator(".wq-feedback-wrong button").click()
                page.get_by_role("button", name=re.compile("回復藥水")).click()
                expect(page.locator(".wq-battle-log")).to_contain_text("HP 恢復")
                expect(page.locator(".wq-mini-hp")).to_contain_text("5/5")
                tested_mistake = True

        guard = 0
        while page.locator('[data-testid="word-quest-battle"]').count():
            guard += 1
            assert guard <= 6, "Battle did not finish in the expected number of turns"
            battle_counter = page.locator(".wq-command-title > div:first-child small").inner_text()
            match = re.search(r"BATTLE (\d+)/4", battle_counter)
            assert match, f"Could not read battle counter: {battle_counter}"
            target_word = words[int(match.group(1)) - 1]
            answer_turn(page, target_word)
            page.wait_for_timeout(80)

        expect(page.locator(".wq-victory")).to_be_visible()
        if stage_index == 0:
            page.screenshot(path=RESULTS / f"word-quest-{profile_key}-victory.png", full_page=True)
        if stage_index < 3:
            page.get_by_role("button", name=re.compile(r"前往第 \d 區")).click()
            expect(page.locator(".wq-route")).to_be_visible()
        else:
            page.get_by_role("button", name="迎接王國黎明").click()

    expect(page.locator(".wq-finale h1")).to_contain_text(finale_title)
    expect(page.get_by_text("QUEST COMPLETE · TRUE HERO", exact=True)).to_be_visible()
    page.screenshot(path=RESULTS / f"word-quest-{profile_key}-finale.png", full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_text(game_title, exact=True).click()
    expect(page.locator(".wq-intro")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.screenshot(path=RESULTS / f"word-quest-{profile_key}-mobile.png", full_page=True)
    page.get_by_role("button", name="繼續冒險").click()
    page.locator(".wq-stage").first.get_by_role("button", name="再次巡邏").click()
    expect(page.locator('[data-testid="word-quest-battle"]')).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.screenshot(path=RESULTS / f"word-quest-{profile_key}-mobile-battle.png", full_page=True)

    assert not console_errors, f"Browser console errors for {profile_key}: {console_errors}"
    context.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    run_profile(browser, "jie", "姊姊勇者傳說", "星語大陸")
    run_profile(browser, "mei", "妹妹勇者傳說", "彩虹王國")
    browser.close()

print("Both Word Quest adventures passed: combat, recovery, bosses, progression, finale, and mobile layout.")
