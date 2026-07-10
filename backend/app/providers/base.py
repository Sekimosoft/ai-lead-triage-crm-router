from abc import ABC, abstractmethod

from app.models.schemas import LeadTriageResult


class AIProvider(ABC):
    """Swappable AI boundary — interpretation only; validation stays deterministic."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def analyze(self, inquiry_text: str) -> LeadTriageResult:
        pass
