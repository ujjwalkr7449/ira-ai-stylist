from fastapi.testclient import TestClient

from main import app
from schemas import ChatRequest


client = TestClient(app)


def test_chat_with_direct_message_extracts_color_and_product() -> None:
    response = client.post("/api/chat", json={"message": "show me red shoes"})
    assert response.status_code == 200

    data = response.json()
    assert data["product"] == "shoes"
    assert data["color"] == "red"
    assert "red shoes" in data["image_prompt"].lower()
    assert data["image_url"].startswith("https://placehold.co/")


def test_chat_defaults_color_to_white_when_missing() -> None:
    response = client.post("/api/chat", json={"message": "i want a hoodie"})
    assert response.status_code == 200

    data = response.json()
    assert data["product"] == "hoodie"
    assert data["color"] == "white"


def test_chat_asks_for_clarification_when_product_missing() -> None:
    response = client.post("/api/chat", json={"message": "show me something nice"})
    assert response.status_code == 200

    data = response.json()
    assert data["product"] is None
    assert "which product" in data["message"].lower()


def test_chat_supports_legacy_messages_payload() -> None:
    response = client.post(
        "/api/chat",
        json={
            "messages": [
                {"role": "assistant", "content": "How can I help?"},
                {"role": "user", "content": "need blue shirt"},
            ]
        },
    )
    assert response.status_code == 200

    data = response.json()
    assert data["product"] == "shirt"
    assert data["color"] == "blue"


def test_chat_request_validation_requires_message_or_user_messages() -> None:
    try:
        ChatRequest(message=None, messages=[])
        assert False, "Expected validation to fail"
    except Exception as exc:  # pydantic validation exception
        assert "Provide either 'message'" in str(exc)
