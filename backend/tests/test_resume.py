"""Tests for resume upload and job description endpoints."""
import io


def test_upload_resume_unauthenticated(client):
    """Test that uploading without auth returns 401."""
    response = client.post("/resumes/upload")
    assert response.status_code == 401


def test_list_resumes_empty(client, auth_headers):
    """Test listing resumes when none exist."""
    response = client.get("/resumes/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_create_job_description(client, auth_headers):
    """Test creating a job description."""
    response = client.post(
        "/job-descriptions/",
        json={
            "title": "Senior Python Developer",
            "raw_text": "We are looking for a senior Python developer with experience in FastAPI, PostgreSQL, and Docker.",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Senior Python Developer"
    assert "id" in data


def test_list_job_descriptions(client, auth_headers):
    """Test listing job descriptions."""
    # Create one first
    client.post(
        "/job-descriptions/",
        json={
            "title": "Test JD",
            "raw_text": "This is a test job description for a software engineer role.",
        },
        headers=auth_headers,
    )
    response = client.get("/job-descriptions/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test JD"


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
