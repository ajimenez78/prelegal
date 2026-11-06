from fastapi.testclient import TestClient

DRAFT = {"documentId": "CSA", "nda": {}, "terms": {"Customer": "Acme"}}
MESSAGES = [{"role": "assistant", "content": "Hi"}, {"role": "user", "content": "A CSA"}]
DOCUMENT = {"documentType": "CSA", "title": "Cloud Service Agreement - Acme", "draft": DRAFT,
            "messages": MESSAGES}


def create(client: TestClient, **changes) -> dict:
    response = client.post("/api/documents", json=DOCUMENT | changes)
    assert response.status_code == 201
    return response.json()


def test_list_starts_empty(signed_in: TestClient):
    assert signed_in.get("/api/documents").json() == []


def test_create_then_get_round_trips(signed_in: TestClient):
    created = create(signed_in)
    fetched = signed_in.get(f"/api/documents/{created['id']}").json()
    assert fetched == created
    assert fetched["draft"] == DRAFT
    assert fetched["messages"] == MESSAGES


def test_list_shows_summaries_newest_first(signed_in: TestClient):
    first = create(signed_in, title="First")
    second = create(signed_in, title="Second")
    titles = [d["title"] for d in signed_in.get("/api/documents").json()]
    assert titles == ["Second", "First"]
    signed_in.put(f"/api/documents/{first['id']}", json=DOCUMENT | {"title": "First again"})
    listed = signed_in.get("/api/documents").json()
    assert [d["id"] for d in listed] == [first["id"], second["id"]]
    assert set(listed[0]) == {"id", "documentType", "title", "updatedAt"}


def test_update_replaces_the_document(signed_in: TestClient):
    created = create(signed_in)
    response = signed_in.put(
        f"/api/documents/{created['id']}", json=DOCUMENT | {"title": "Renamed"}
    )
    assert response.json()["title"] == "Renamed"


def test_other_users_cannot_see_a_document(signed_in: TestClient):
    created = create(signed_in)
    signed_in.post("/api/logout")
    signed_in.post("/api/signup", json={"email": "bob@example.com", "password": "secret123"})
    assert signed_in.get("/api/documents").json() == []
    assert signed_in.get(f"/api/documents/{created['id']}").status_code == 404
    response = signed_in.put(f"/api/documents/{created['id']}", json=DOCUMENT)
    assert response.status_code == 404


def test_documents_require_a_session(client: TestClient):
    assert client.get("/api/documents").status_code == 401
    assert client.post("/api/documents", json=DOCUMENT).status_code == 401
