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
    torstol=10,  # no spreadsheet data for this herb; invented to exercise it here
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

    assert response.xp_banked == pytest.approx(205142.5)
    assert response.xp_needed == 269190
    assert response.xp_remaining == pytest.approx(64047.5)
    assert response.xp_surplus == 0.0


def test_breakdown_matches_spreadsheet_column_d():
    request = Request(current_xp=468437, target_level=70, herbs=WORKED_EXAMPLE_HERBS)

    response = calculate(request)

    guam = next(item for item in response.breakdown if item.herb == "guam")
    assert guam.quantity == 22
    assert guam.xp_per_potion == 25.0
    assert guam.xp == 550.0

    torstol = next(item for item in response.breakdown if item.herb == "torstol")
    assert torstol.quantity == 10
    assert torstol.xp_per_potion == 150.0
    assert torstol.xp == 1500.0


def test_already_at_target_level_clamps_to_zero():
    herbs = ZERO_HERBS.model_copy()
    request = Request(current_xp=737627, target_level=70, herbs=herbs)

    response = calculate(request)

    assert response.xp_needed == 0
    assert response.xp_remaining == 0.0
    assert response.xp_surplus == 0.0


def test_already_past_target_plus_banked_herbs_both_count_toward_surplus():
    # current_xp alone already exceeds the target, and there are banked herbs
    # on top -- xp_surplus should reflect both sources, not just one.
    herbs = ZERO_HERBS.model_copy(update={"kwuarm": 100})
    request = Request(current_xp=800000, target_level=70, herbs=herbs)

    response = calculate(request)

    assert response.xp_needed == 0
    assert response.xp_remaining == 0.0
    assert response.xp_surplus == pytest.approx(74873.0)


def test_banked_herbs_alone_cover_the_gap():
    herbs = ZERO_HERBS.model_copy(update={"kwuarm": 3000})
    request = Request(current_xp=468437, target_level=70, herbs=herbs)

    response = calculate(request)

    # xp_needed ignores herbs entirely, so it stays positive even though
    # xp_remaining (which accounts for banked herbs) clamps to zero.
    assert response.xp_needed == 269190
    assert response.xp_remaining == 0.0
    assert response.xp_surplus == pytest.approx(105810.0)


def test_xp_sums_are_exact_not_approximate():
    # Every XP-per-potion value is a multiple of 2.5, which is exactly
    # representable in binary floating point -- so summing them shouldn't
    # drift, and this is safe to assert with == rather than pytest.approx.
    herbs = ZERO_HERBS.model_copy(update=dict.fromkeys(HerbQuantities.model_fields, 1))
    request = Request(current_xp=0, target_level=1, herbs=herbs)

    response = calculate(request)

    assert response.xp_banked == 1552.5
