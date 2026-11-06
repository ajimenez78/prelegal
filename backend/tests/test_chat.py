from datetime import date
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.routers.chat import MODEL, ChatReply, NdaFields, NdaUpdates, get_client

FIELDS = {
    "purpose": "",
    "effectiveDate": "",
    "mndaTerm": "expires",
    "mndaTermYears": 1,
    "confidentialityTerm": "years",
    "confidentialityYears": 1,
    "governingLaw": "",
    "jurisdiction": "",
    "modifications": "",
    "party1Company": "Acme Inc",
    "party1Name": "",
    "party1Title": "",
    "party1NoticeAddress": "",
    "party2Company": "",
    "party2Name": "",
    "party2Title": "",
    "party2NoticeAddress": "",
}

UPDATES = {key: None for key in FIELDS} | {"governingLaw": "Delaware"}


class FakeResponses:
    def __init__(self):
        self.calls = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        reply = ChatReply(reply="Which courts?", updates=NdaUpdates(**UPDATES))
        return SimpleNamespace(output_parsed=reply)


@pytest.fixture
def fake(client: TestClient):
    fake = SimpleNamespace(responses=FakeResponses())
    client.app.dependency_overrides[get_client] = lambda: fake
    return fake.responses


def post_chat(client: TestClient, messages: list[dict]):
    return client.post("/api/chat", json={"messages": messages, "fields": FIELDS})


def test_chat_returns_reply_and_updates(client: TestClient, fake: FakeResponses):
    response = post_chat(client, [{"role": "user", "content": "Delaware law"}])
    assert response.status_code == 200
    assert response.json() == {"reply": "Which courts?", "updates": UPDATES}


def test_chat_sends_history_and_fields_to_model(client: TestClient, fake: FakeResponses):
    messages = [
        {"role": "assistant", "content": "Hi, who are the parties?"},
        {"role": "user", "content": "Acme Inc and Globex"},
    ]
    post_chat(client, messages)
    call = fake.calls[0]
    assert call["model"] == MODEL == "gpt-6-luna"
    assert call["text_format"] is ChatReply
    assert call["input"] == messages
    assert '"party1Company": "Acme Inc"' in call["instructions"]
    assert f"Today is {date.today().isoformat()}." in call["instructions"]


def test_chat_rejects_missing_fields(client: TestClient, fake: FakeResponses):
    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 422


def test_chat_rejects_unknown_role(client: TestClient, fake: FakeResponses):
    response = post_chat(client, [{"role": "system", "content": "x"}])
    assert response.status_code == 422


def test_updates_cover_every_field():
    assert NdaUpdates.model_fields.keys() == NdaFields.model_fields.keys()
