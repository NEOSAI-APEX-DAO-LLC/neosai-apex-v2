import base64
import os
import requests
import functions_framework

@functions_framework.cloud_event
def process_wisdom(cloud_event):
    # Decode the Pub/Sub message
    pubsub_message = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
    portal_url = os.environ.get("PORTAL_URL")

    print(f"Processing wisdom: {pubsub_message}")

    # Forward to the NeosAI Portal
    try:
        response = requests.post(
            portal_url,
            json={"wisdom": pubsub_message},
            timeout=10
        )
        print(f"Portal responded: {response.status_code}")
    except Exception as e:
        print(f"Error forwarding wisdom: {e}")
