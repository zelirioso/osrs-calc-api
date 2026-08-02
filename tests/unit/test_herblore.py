import pytest

from app.calculators.herblore import HerbQuantities, Request, calculate

WORKED_EXAMPLE_HERBS = HerbQuantities(
    guam=22,
    marrentill=59,
    tarromin=208,
    harralander=150,
    ranarr=63,
    irit=266,
    avantoe=290,
    kwuarm=344,
    snapdragon=29,
    cadantine=306,
    lantadyme=77,
    toadflax=4,
    dwarf_weed=51,
    torstol=0,
)

ZERO_HERBS = HerbQuantities(
    guam=0,
    marrentill=0,
    tarromin=0,
    harralander=0,
    ranarr=0,
    irit=0,
    avantoe=0,
    kwuarm=0,
    snapdragon=0,
    cadantine=0,
    lantadyme=0,
    toadflax=0,
    dwarf_weed=0,
    torstol=0,
)


def test_worked_example_from_spec():
    # docs/calculators/herblore.md worked example, transcribed from the spreadsheet
    request = Request(current_xp=468437, target_level=70, herbs=WORKED_EXAMPLE_HERBS)

    response = calculate(request)

    assert response.xp_banked == pytest.approx(203642.5)
    assert response.xp_needed == 269190
    assert response.xp_remaining == pytest.approx(65547.5)
    assert response.xp_surplus == 0.0


def test_breakdown_matches_spreadsheet_column_d():
    request = Request(current_xp=468437, target_level=70, herbs=WORKED_EXAMPLE_HERBS)

    response = calculate(request)

    guam = next(item for item in response.breakdown if item.herb == "guam")
    assert guam.quantity == 22
    assert guam.xp_per_potion == 25.0
    assert guam.xp == 550.0


def test_already_at_target_level_clamps_to_zero():
    herbs = ZERO_HERBS.model_copy()
    request = Request(current_xp=737627, target_level=70, herbs=herbs)

    response = calculate(request)

    assert response.xp_needed == 0
    assert response.xp_remaining == 0.0
    assert response.xp_surplus == 0.0


def test_torstol_contributes_to_xp_banked():
    # torstol is 0 in the worked example (absent from the original spreadsheet),
    # so this exercises it directly: Super combat potion, 150 XP each.
    herbs = ZERO_HERBS.model_copy(update={"torstol": 10})
    request = Request(current_xp=468437, target_level=70, herbs=herbs)

    response = calculate(request)

    torstol = next(item for item in response.breakdown if item.herb == "torstol")
    assert torstol.xp_per_potion == 150.0
    assert torstol.xp == 1500.0
    assert response.xp_banked == pytest.approx(1500.0)


def test_banked_herbs_alone_cover_the_gap():
    herbs = ZERO_HERBS.model_copy(update={"kwuarm": 3000})
    request = Request(current_xp=468437, target_level=70, herbs=herbs)

    response = calculate(request)

    # xp_needed ignores herbs entirely, so it stays positive even though
    # xp_remaining (which accounts for banked herbs) clamps to zero.
    assert response.xp_needed == 269190
    assert response.xp_remaining == 0.0
    assert response.xp_surplus == pytest.approx(105810.0)
