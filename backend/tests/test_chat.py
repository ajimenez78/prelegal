from datetime import date
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.routers.chat import MODEL, ChatReply, NdaFields, NdaUpdates, Term, get_client

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

DOCUMENTS = [
    {
        "id": "Mutual-NDA",
        "name": "Mutual Non-Disclosure Agreement",
        "description": "Share confidential information.",
        "terms": [],
    },
    {
        "id": "CSA",
        "name": "Cloud Service Agreement",
        "description": "SaaS terms.",
        "terms": ["Customer", "Provider", "Subscription Period"],
    },
]


class FakeResponses:
    def __init__(self):
        self.calls = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        reply = ChatReply(
            reply="Which courts?",
            documentType="Mutual-NDA",
            updates=NdaUpdates(**UPDATES),
            terms=[],
        )
        return SimpleNamespace(output_parsed=reply)


@pytest.fixture
def fake(client: TestClient):
    fake = SimpleNamespace(responses=FakeResponses())
    client.app.dependency_overrides[get_client] = lambda: fake
    return fake.responses


def post_chat(client: TestClient, messages: list[dict], document=None, terms=()):
    body = {
        "messages": messages,
        "documentType": document,
        "fields": FIELDS,
        "terms": list(terms),
        "documents": DOCUMENTS,
    }
    return client.post("/api/chat", json=body)


def test_chat_returns_reply_and_updates(client: TestClient, fake: FakeResponses):
    response = post_chat(client, [{"role": "user", "content": "Delaware law"}])
    assert response.status_code == 200
    assert response.json() == {
        "reply": "Which courts?",
        "documentType": "Mutual-NDA",
        "updates": UPDATES,
        "terms": [],
    }


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
    assert f"Today is {date.today().isoformat()}." in call["instructions"]


def instructions(client: TestClient, fake: FakeResponses, **kwargs) -> str:
    post_chat(client, [{"role": "user", "content": "Hi"}], **kwargs)
    return fake.calls[-1]["instructions"]


def test_prompt_lists_supported_documents(client: TestClient, fake: FakeResponses):
    prompt = instructions(client, fake)
    assert "- Mutual-NDA: Mutual Non-Disclosure Agreement - Share" in prompt
    assert "- CSA: Cloud Service Agreement - SaaS terms. Terms: Customer, " in prompt
    assert "closest supported document" in prompt
    assert "No document chosen yet." in prompt


def test_prompt_for_nda_includes_its_fields(client: TestClient, fake: FakeResponses):
    prompt = instructions(client, fake, document="Mutual-NDA")
    assert "The chosen document is the Mutual NDA." in prompt
    assert '"party1Company": "Acme Inc"' in prompt


def test_prompt_for_other_document_includes_its_terms(
    client: TestClient, fake: FakeResponses
):
    terms = [{"term": "Customer", "value": "Acme Inc"}]
    prompt = instructions(client, fake, document="CSA", terms=terms)
    assert "The chosen document is Cloud Service Agreement." in prompt
    assert "by exact name: Customer, Provider, Subscription Period." in prompt
    assert '"value": "Acme Inc"' in prompt


def test_reply_carries_term_updates():
    reply = ChatReply(
        reply="ok",
        documentType="CSA",
        updates=NdaUpdates(**UPDATES),
        terms=[Term(term="Customer", value="Acme Inc")],
    )
    assert reply.model_dump()["terms"] == [{"term": "Customer", "value": "Acme Inc"}]


def test_chat_rejects_missing_fields(client: TestClient, fake: FakeResponses):
    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 422


def test_chat_rejects_unknown_role(client: TestClient, fake: FakeResponses):
    response = post_chat(client, [{"role": "system", "content": "x"}])
    assert response.status_code == 422


def test_updates_cover_every_field():
    assert NdaUpdates.model_fields.keys() == NdaFields.model_fields.keys()
