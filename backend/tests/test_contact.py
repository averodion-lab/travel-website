"""Contact form: the owner gets an email they can reply to; nothing is stored."""
import pytest

from app.api import public


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    public._contact_hits.clear()


def send(client, **overrides):
    body = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "phone": "555-0100",
        "dates": "Early October",
        "message": "Can you deliver to a lake near Ellijay?",
        **overrides,
    }
    return client.post("/api/contact", json=body)


def test_message_is_emailed_to_the_owner_with_reply_to(client, sent_emails):
    res = send(client)
    assert res.status_code == 200, res.get_json()
    mail = sent_emails[0]
    assert mail["to"] == "owner@example.com"
    assert mail["reply_to"] == "ada@example.com"
    assert "Ellijay" in mail["body"] and "Ada Lovelace" in mail["subject"]


@pytest.mark.parametrize(
    "field,value",
    [("name", ""), ("email", "not-an-email"), ("message", ""), ("message", "x" * 4001), ("name", "x" * 121)],
)
def test_invalid_messages_are_refused(client, sent_emails, field, value):
    assert send(client, **{field: value}).status_code == 400
    assert sent_emails == []


def test_bots_filling_the_hidden_field_are_quietly_ignored(client, sent_emails):
    res = send(client, website="http://spam.example")
    assert res.status_code == 200
    assert sent_emails == []


def test_too_many_messages_are_slowed_down(client, sent_emails):
    for _ in range(5):
        assert send(client).status_code == 200
    assert send(client).status_code == 429
