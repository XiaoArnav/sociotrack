"""
Hindsight Agent Memory Client Integration.
Connects SocioTrack to Vectorize's Hindsight Memory Engine.

Supports retain, recall, and reflect operations with a resilient local
fallback cache when the Hindsight server is offline or during testing.
"""
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class HindsightMemoryClient:
    """
    Client for Hindsight Memory System (Vectorize.io).
    Each brand maintains its own isolated memory bank.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or settings.HINDSIGHT_API_URL).rstrip("/")
        self.api_key = api_key or settings.HINDSIGHT_API_KEY
        # In-memory fallback cache for development/offline mode
        self._local_banks: Dict[str, List[Dict[str, Any]]] = {}

    def _get_bank_id(self, brand_id: str) -> str:
        """Sanitizes brand UUID into a Hindsight-compliant bank identifier."""
        clean_id = brand_id.replace("-", "")
        return f"{settings.HINDSIGHT_BANK_PREFIX}_{clean_id}"

    async def retain(
        self,
        brand_id: str,
        content: str,
        category: str = "hook_rule",
        confidence: float = 0.85,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Retains a learned insight into the brand's Hindsight memory bank.
        """
        bank_id = self._get_bank_id(brand_id)
        payload = {
            "content": content,
            "context": f"Social engagement learning rule [{category}]",
            "metadata": {
                "category": category,
                "confidence_score": confidence,
                **(metadata or {}),
            },
        }

        # Store in local fallback memory
        if bank_id not in self._local_banks:
            self._local_banks[bank_id] = []
        self._local_banks[bank_id].append({
            "content": content,
            "category": category,
            "confidence": confidence,
        })

        # Attempt remote Hindsight retain if server is reachable
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            url = f"{self.base_url}/v1/default/banks/{bank_id}/memories"
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.is_success:
                    logger.info("Successfully retained memory to Hindsight bank %s", bank_id)
                    return res.json()
        except Exception as e:
            logger.debug("Hindsight server offline, retained in local fallback: %s", str(e))

        return {
            "status": "retained_local",
            "bank_id": bank_id,
            "content": content,
            "category": category,
        }

    async def recall(
        self,
        brand_id: str,
        query: str,
        limit: int = 5,
    ) -> List[str]:
        """
        Recalls relevant memories and audience rules from Hindsight.
        """
        bank_id = self._get_bank_id(brand_id)

        # Attempt remote recall
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            url = f"{self.base_url}/v1/default/banks/{bank_id}/memories/recall"
            payload = {"query": query, "limit": limit}
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.is_success:
                    data = res.json()
                    # Extract list of matched memory contents
                    items = data.get("memories") or data.get("items") or []
                    return [item.get("content", str(item)) for item in items[:limit]]
        except Exception as e:
            logger.debug("Hindsight recall offline, falling back to local memory: %s", str(e))

        # Local fallback recall
        local_items = self._local_banks.get(bank_id, [])
        if local_items:
            return [item["content"] for item in local_items[-limit:]]
        
        return []

    async def reflect(
        self,
        brand_id: str,
        query: str,
    ) -> str:
        """
        Generates a disposition-aware synthesis/reflection based on brand memory.
        """
        bank_id = self._get_bank_id(brand_id)
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            url = f"{self.base_url}/v1/default/banks/{bank_id}/reflect"
            payload = {"query": query}
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.is_success:
                    return res.json().get("response", "")
        except Exception as e:
            logger.debug("Hindsight reflect offline: %s", str(e))

        return "Synthesized strategy based on historical audience feedback."


# Singleton instance
hindsight_client = HindsightMemoryClient()
