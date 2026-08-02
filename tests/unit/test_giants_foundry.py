from app.calculators.giants_foundry import ItemQuantities, Request, calculate

ZERO_ITEMS = ItemQuantities(
    scimitar=0,
    longsword=0,
    full_helm=0,
    square_shield=0,
    claws=0,
    warhammer=0,
    battleaxe=0,
    chainbody=0,
    kiteshield=0,
    two_handed_sword=0,
    platelegs=0,
    plateskirt=0,
    platebody=0,
    bars=0,
    ore=0,
)

# docs/calculators/giants_foundry.md worked example
WORKED_EXAMPLE_MITHRIL_ITEMS = ZERO_ITEMS.model_copy(
    update={"full_helm": 63, "battleaxe": 32, "bars": 1499, "ore": 991}
)
WORKED_EXAMPLE_ADAMANT_ITEMS = ZERO_ITEMS.model_copy(
    update={
        "scimitar": 19,
        "battleaxe": 256,
        "chainbody": 2,
        "kiteshield": 296,
        "platelegs": 32,
        "platebody": 45,
        "bars": 1495,
        "ore": 5328,
    }
)
WORKED_EXAMPLE_RUNE_ITEMS = ZERO_ITEMS.model_copy(update={"bars": 215, "ore": 736})

# docs/calculators/giants_foundry.md "Mithril-heavy ladder" table, all 14 rows
EXPECTED_MITHRIL_HEAVY_ROWS = [
    (86, 0, 0, 0, 2617, 0, 8194),
    (87, 372344, 24, 432, 2185, 240, 7954),
    (88, 785826, 51, 918, 1699, 510, 7684),
    (89, 1242345, 80, 1440, 1177, 800, 7394),
    (90, 1746382, 113, 2034, 583, 1130, 7064),
    (91, 2302881, 148, 2664, -47, 1480, 6714),
    (92, 2917303, 188, 3384, -767, 1880, 6314),
    (93, 3595679, 232, 4176, -1559, 2320, 5874),
    (94, 4344664, 280, 5040, -2423, 2800, 5394),
    (95, 5171608, 333, 5994, -3377, 3330, 4864),
    (96, 6084627, 392, 7056, -4439, 3920, 4274),
    (97, 7092679, 456, 8208, -5591, 4560, 3634),
    (98, 8205656, 528, 9504, -6887, 5280, 2914),
    (99, 9434481, 607, 10926, -8309, 6070, 2124),
]


def worked_example_request(**overrides):
    defaults = {
        "current_xp": 3599950,
        "target_level": 99,
        "mithril_items": WORKED_EXAMPLE_MITHRIL_ITEMS,
        "adamant_items": WORKED_EXAMPLE_ADAMANT_ITEMS,
        "rune_items": WORKED_EXAMPLE_RUNE_ITEMS,
    }
    defaults.update(overrides)
    return Request(**defaults)


def test_mithril_heavy_ladder_matches_spreadsheet_exactly():
    # all 14 rows, verified programmatically against the sheet's cached
    # K/L/M/N/O columns before being written into the spec doc
    response = calculate(worked_example_request())

    assert len(response.mithril_heavy_ladder) == 14
    for row, expected in zip(
        response.mithril_heavy_ladder, EXPECTED_MITHRIL_HEAVY_ROWS
    ):
        (
            level,
            xp_needed,
            swords,
            mith_needed,
            mith_remaining,
            adam_needed,
            adam_remaining,
        ) = expected
        assert row.level == level
        assert row.xp_needed == xp_needed
        assert row.swords_needed == swords
        assert row.mithril_bars_needed == mith_needed
        assert row.mithril_bars_remaining == mith_remaining
        assert row.adamant_bars_needed == adam_needed
        assert row.adamant_bars_remaining == adam_remaining


def test_adamant_rune_ladder_level_87_spot_check():
    response = calculate(worked_example_request())

    level_87 = next(row for row in response.adamant_rune_ladder if row.level == 87)
    assert level_87.xp_needed == 372344
    assert level_87.swords_needed == 18
    assert level_87.adamant_bars_needed == 324
    assert level_87.adamant_bars_remaining == 7870
    assert level_87.rune_bars_needed == 180
    assert level_87.rune_bars_remaining == 771


def test_current_level_is_included_as_the_first_ladder_row():
    # current_xp = 3,599,950 sits in level 86 -- the ladder starts there,
    # matching the sheet's own inclusion of the current level as row 1
    response = calculate(worked_example_request())

    assert response.mithril_heavy_ladder[0].level == 86
    assert response.adamant_rune_ladder[0].level == 86


def test_target_level_below_current_level_gives_empty_ladders():
    request = worked_example_request(target_level=80)  # below level 86

    response = calculate(request)

    assert response.mithril_heavy_ladder == []
    assert response.adamant_heavy_ladder == []
    assert response.adamant_rune_ladder == []


def test_custom_avg_xp_changes_swords_needed():
    request = worked_example_request(target_level=87, mithril_adamant_avg_xp=100000.0)

    response = calculate(request)

    level_87 = next(row for row in response.mithril_heavy_ladder if row.level == 87)
    assert level_87.swords_needed == 4  # ceil(372344 / 100000)
