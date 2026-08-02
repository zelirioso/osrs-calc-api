from app.core.xp_table import level_at, xp_at


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


def test_strictly_increasing_across_the_whole_table():
    # catches any future transcription slip if XP_TABLE is ever hand-edited
    assert all(xp_at(level + 1) > xp_at(level) for level in range(1, 99))


def test_level_at_is_the_inverse_of_xp_at():
    # docs/calculators/giants_foundry.md worked example: 3,599,950 sits in
    # level 86 (level 87 starts at 3,972,294)
    assert level_at(3599950) == 86
    assert all(level_at(xp_at(level)) == level for level in range(1, 100))
