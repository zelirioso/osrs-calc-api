from pydantic import BaseModel, ConfigDict


class StrictModel(BaseModel):
    """Base for request models: unknown fields 422 instead of being silently dropped."""

    model_config = ConfigDict(extra="forbid")
