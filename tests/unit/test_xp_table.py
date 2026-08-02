from app.core.xp_table import xp_at


def test_level_1_is_zero():
    assert xp_at(1) == 0


def test_level_66_boundary():
    # docs/calculators/herblore.md: current_xp = 468437 sits in level 65,
    # level 66 starts at 496,254
    assert xp_at(66) == 496254


def test_level_70_matches_herblore_spreadsheet():
    assert xp_at(70) == 737627


def test_level_99_max():
    assert xp_at(99) == 13034431
