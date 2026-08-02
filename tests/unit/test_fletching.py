import pytest

from app.calculators.fletching import Request, calculate


def test_worked_example_a_matches_spreadsheet():
    # docs/calculators/fletching.md worked example A -- matches the
    # spreadsheet's own cached values exactly (banked_arrow_shafts defaults
    # to 0, reducing to the sheet's original formula).
    request = Request(current_xp=2239474, target_level=90)

    response = calculate(request)

    assert response.xp_needed == 3106858
    assert response.logs_needed == 4569
    assert response.shafts_used_from_banked == 0
    assert response.shafts_remaining_banked == 0
    assert response.feathers_needed == 274140
    assert response.broad_arrowheads_needed == 274140
    assert response.feather_cost == pytest.approx(962203.986)
    assert response.broad_arrowhead_cost == pytest.approx(15077700.0)
    assert response.total_cost == pytest.approx(16039903.986)


def test_worked_example_b_banked_shafts_partially_cover_target():
    # docs/calculators/fletching.md worked example B -- 50,000 banked
    # shafts aren't enough alone, so both branches of the logic run.
    request = Request(current_xp=2239474, target_level=90, banked_arrow_shafts=50000)

    response = calculate(request)

    assert response.xp_needed == 3106858
    assert response.logs_needed == 3761
    assert response.shafts_used_from_banked == 50000
    assert response.shafts_remaining_banked == 0
    assert response.feathers_needed == 275660
    assert response.broad_arrowheads_needed == 275660
    assert response.feather_cost == pytest.approx(967539.034)
    assert response.broad_arrowhead_cost == pytest.approx(15161300.0)
    assert response.total_cost == pytest.approx(16128839.034)


def test_banked_shafts_alone_fully_cover_target_with_leftover():
    request = Request(current_xp=2239474, target_level=90, banked_arrow_shafts=300000)

    response = calculate(request)

    assert response.logs_needed == 0
    assert response.shafts_used_from_banked == 282442
    assert response.shafts_remaining_banked == 17558
    assert response.feathers_needed == 282442
    assert response.total_cost == pytest.approx(16525653.1758)


def test_already_at_target_level_needs_nothing():
    request = Request(current_xp=5346332, target_level=90, banked_arrow_shafts=1000)

    response = calculate(request)

    assert response.xp_needed == 0
    assert response.logs_needed == 0
    assert response.shafts_used_from_banked == 0
    assert response.shafts_remaining_banked == 1000
    assert response.feathers_needed == 0
    assert response.total_cost == 0.0


def test_custom_prices_are_used():
    request = Request(
        current_xp=0,
        target_level=2,
        feather_price=1.0,
        broad_arrowhead_price=2.0,
    )

    response = calculate(request)

    assert response.logs_needed == 1
    assert response.feathers_needed == 60
    assert response.feather_cost == pytest.approx(60.0)
    assert response.broad_arrowhead_cost == pytest.approx(120.0)
    assert response.total_cost == pytest.approx(180.0)
